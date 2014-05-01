using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.FtpClient;
using System.Security;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Thralldom.OfflineTool
{
    class AppBuilder
    {
        private FtpClient client;
        private string pathToGame;
        private string pathToSite;

        private List<Stream> streams;

        private string[] DirectoryMasks = { "/ProjectThralldom", "/Content", "/Scripts" };
        private string[] PhysicalRoots =  { "ProjectThralldom", "Thralldom.Web" };
        private string Root = "game/";
        private List<string> textFormats = new List<string>() { ".js", ".anim", ".script", ".srt", };
        private string allowedExtensions = "*.html | *.manifest | *.css | *.js | *.png | *.jpg | *.jpeg | *.mp3 | *.tscr | *.anim | *.srt | " + 
                                           "*.otf | *.ttf | *.woff | *.cur";
        private int WaitTime = 50;
        private int connectionLimit = 2;

        public AppBuilder(string user, string pass, string domain, string pathToGame, string pathToSite)
        {
            this.pathToGame = pathToGame;
            this.pathToSite = pathToSite;

            this.streams = new List<Stream>();

            this.client = new FtpClient();
            client.Credentials = new System.Net.NetworkCredential(user, pass, domain);
            client.Host = domain;
            client.Connect();
        }

        public void BuildGame()
        {
            GenerateManifest(this.pathToGame);
            BuildIndex(this.pathToGame);
        }

        private void DeployGame()
        {
            Action<string> rootNormalizedDir = FuncExtensions.Partial<Func<string, string>, string>(CreateDirectory, NormalizeFileNameGame);
            Action<string> rootNormalizedFile = FuncExtensions.Partial<Func<string, string>, string>(UploadFile, NormalizeFileNameGame);

            string ignored = "Code Scripts Docs Tests typings bin obj Properties";
            TraverseFileSystem(this.pathToGame, rootNormalizedDir, rootNormalizedFile, this.allowedExtensions, ignored);
            string[] physics = { "Constants.js", "Pool.js", "Physics/SharedInterfaces.js", "Physics/PhysicsManagerWorker.js", "Physics/Worker.js" };
            this.CreateDirectory((str) => this.Root + str, "Code/"); 
            this.CreateDirectory((str) => this.Root + str, "Code/Physics/");
            foreach (var file in physics)
            {
                this.UploadFile(this.NormalizeFileNameGame, this.pathToGame + "\\Code\\" + file);
            }
        }

        private void DeploySite()
        {
            Action<string> normalizedDir = FuncExtensions.Partial<Func<string, string>, string>(CreateDirectory, NormalizeFileNameSite);
            Action<string> normalizedFile = FuncExtensions.Partial<Func<string, string>, string>(UploadFile, NormalizeFileNameSite);
            TraverseFileSystem(this.pathToSite, normalizedDir, normalizedFile, this.allowedExtensions, "bin obj Properties less");
        }

        public void Deploy()
        {
            this.DeployGame();
            this.DeploySite();


            while (this.streams.Count != 0)
            {
                Thread.Sleep(this.WaitTime);
            }
        }
        
        private string NormalizeFileNameSite(string file)
        {
            string normalized = file.Replace("\\", "/");
            IEnumerable<int> maskIndices = DirectoryMasks.Select((mask) => normalized.LastIndexOf(mask));
            foreach (int index in maskIndices)
	        {
                if (index != -1)
                {
                    normalized = normalized.Remove(0, index + 1);
                }
	        }

            foreach (var root in this.PhysicalRoots)
            {
                normalized = normalized.Replace(root, ""); ;
            }

            return normalized;
        }

        private string NormalizeFileNameGame(string file)
        {
            return this.Root + this.NormalizeFileNameSite(file);
        }

        private void UploadFile(Func<string, string> normalizationFunction, string file)
        {
            while (this.streams.Count > this.connectionLimit)
            {
                Thread.Sleep(this.WaitTime);
            }

            string normalized = normalizationFunction(file);
            Stream stream = client.OpenWrite(normalized, FtpDataType.Binary);

            byte[] bytes;
            if (this.textFormats.IndexOf(Path.GetExtension(file)) != -1)
            {
                bytes = Encoding.UTF8.GetBytes(File.ReadAllText(file));
            }
            else
            {
                bytes = File.ReadAllBytes(file);
            }

            Task task = stream.WriteAsync(bytes, 0, bytes.Length);
            task.ContinueWith((t) =>
            {
                Console.WriteLine("{0} uploaded", normalized);
                this.streams.Remove(stream);

                try
                {
                    stream.Dispose();
                }
                catch (TimeoutException )
                {
                    Console.WriteLine("Exception on {0}", normalized);
                }
            });
            this.streams.Add(stream);

        }

        private void CreateDirectory(Func<string, string> normalizationFunction, string dir)
        {
            this.client.CreateDirectory(normalizationFunction(dir));
        }

        private string ManifestFolder(string path, string folder)
        {
            StringBuilder content = new StringBuilder();
            content.AppendFormat("# {0}\n", folder);
            string contentFolder = path + string.Format("\\{0}\\", folder);
            TraverseFileSystem(contentFolder, (dir) => { }, (file) =>
            {
                string unixFileName = this.NormalizeFileNameSite(file);
                content.AppendLine(unixFileName);
            });
            return content.ToString();
        }

        private void GenerateManifest(string path)
        {
            string header = "CACHE MANIFEST";
            string timestamp = "# " + DateTime.UtcNow.ToString();

            // Pages
            string pages = "# Pages\nindex.html\napp.css";

            // Physics async
            string[] physics = { "Constants.js", "Pool.js", "Physics/SharedInterfaces.js", "Physics/PhysicsManagerWorker.js", "Physics/Worker.js" };
            string code = "# Code\nthralldom.min.js\nthralldom.dependencies.min.js";

            code += physics.Select((x) => "/Code/" + x).Aggregate(string.Empty, (previous, current) => previous + "\n" + current);
            
            // Content, images, fonts
            string content = this.ManifestFolder(path, "Content");
            string images = this.ManifestFolder(path, "Images");
            string fonts = this.ManifestFolder(path, "Fonts");

            // Build everything
            string[] parts = { header, timestamp, pages, code, content, images, fonts };
            string output = parts.Aggregate(string.Empty, (previous, current) => previous += current + "\n\n");
            File.WriteAllText(path + "\\cache.manifest", output);
        }

        private IEnumerable<string> GetFilteredFiles(string path, string searchPattern)
        {
            string[] filters = searchPattern.Split('|');
            List<string> files = new List<string>();
            foreach (var filter in filters)
	        {
		        files.AddRange(Directory.GetFiles(path, filter.Trim()));
	        }
            return files;
        }

        private void TraverseFileSystem(string path, Action<string> dirCallback, Action<string> fileCallback)
        {
            this.TraverseFileSystem(path, dirCallback, fileCallback, "*", "");
        }
        private void TraverseFileSystem(string path, Action<string> dirCallback, Action<string> fileCallback, string searchPattern, string ignoredDirectories)
        {
            foreach (var dir in Directory.EnumerateDirectories(path))
            {
                if (!ignoredDirectories.Contains(Path.GetFileName(dir)))
                {
                    dirCallback(dir);
                    TraverseFileSystem(dir, dirCallback, fileCallback, searchPattern, ignoredDirectories);
                }
            }
            foreach (var file in GetFilteredFiles(path, searchPattern))
            {
                fileCallback(file);
            }
        }

        private void BuildIndex(string path)
        {
            // Replace my files with the thralldom.js
            string content = File.ReadAllText(path + "\\default.htm");
            string thralldomStart = @"<!--@ThralldomCodeBegin-->";
            string thralldomEnd = @"<!--@ThralldomCodeEnd-->";
            string depedenciesStart = @"<!--@ThralldomDependenciesBegin-->";
            string depedenciesEnd = @"<!--@ThralldomDependenciesEnd-->";


            string replacementFormat = "<script src='{0}'></script>";
            string findPattern = @"{0}[\s\S]*{1}";

            string output = Regex.Replace(content, 
                                        string.Format(findPattern, thralldomStart, thralldomEnd), 
                                        string.Format(replacementFormat, "thralldom.min.js"));

            output = Regex.Replace(output, 
                                string.Format(findPattern, depedenciesStart, depedenciesEnd), 
                                string.Format(replacementFormat, "thralldom.dependencies.min.js"));

            // Attach the manifest
            string manifestPlaceholder = "<html";
            string manifestPath = "<html manifest='cache.manifest'";
            output = output.Replace(manifestPlaceholder, manifestPath);

            File.WriteAllText(path + "\\index.html", output);
        }
    }
}
