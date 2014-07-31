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
        private string dependenciesPath = "thralldom.dependencies.min.js";
        private string mainJsPath = "thralldom.min.js";
        private string[] workerFiles = { "Scripts/implementations/ammo.small.js", "Scripts/implementations/polyfills.js", "Code/Constants.js", "Code/Pool.js", "Code/Physics/SharedInterfaces.js", "Code/Physics/PhysicsManagerWorker.js", "Code/Physics/Worker.js" };
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
            this.CreateDirectory((str) => this.Root + str, "Code/");
            this.CreateDirectory((str) => this.Root + str, "Code/Physics/");
            this.CreateDirectory((str) => this.Root + str, "Scripts/");
            this.CreateDirectory((str) => this.Root + str, "Scripts/implementations");
            foreach (var file in this.workerFiles)
            {
                this.UploadFile(this.NormalizeFileNameGame, this.pathToGame + "\\" + file);
            }
        }

        private void DeploySite()
        {
            Action<string> normalizedDir = FuncExtensions.Partial<Func<string, string>, string>(CreateDirectory, NormalizeFileNameSite);
            Action<string> normalizedFile = FuncExtensions.Partial<Func<string, string>, string>(UploadFile, NormalizeFileNameSite);
            TraverseFileSystem(this.pathToSite, normalizedDir, normalizedFile, this.allowedExtensions, "bin obj Properties");
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
                Console.ForegroundColor = ConsoleColor.Green;
                Console.Write("Uploaded: ");
                Console.ForegroundColor = ConsoleColor.White;
                Console.WriteLine(normalized);
                this.streams.Remove(stream);

                try
                {
                    stream.Dispose();
                }
                catch (TimeoutException )
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.Write("Timeout: ");
                    Console.ForegroundColor = ConsoleColor.White;
                    Console.WriteLine(normalized);
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
            string code = String.Format("# Code\n{0}\n{1}", this.mainJsPath, this.dependenciesPath);

            code += this.workerFiles.Aggregate(string.Empty, (previous, current) => previous + "\n" + current);
            
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

        private void BuildDepedencies(string root, IEnumerable<string> dependencies)
        {
            string code = String.Join("\n", dependencies.Select((path) => File.ReadAllText(root + "\\" + path)));
            File.WriteAllText(root + "\\" + this.dependenciesPath, code);
        }

        private void BuildIndex(string path)
        {
            // Replace my files with the thralldom.js
            string content = File.ReadAllText(path + "\\default.htm");
            string thralldomStart = @"<!--@ThralldomCodeBegin-->";
            string thralldomEnd = @"<!--@ThralldomCodeEnd-->";
            string dependenciesStart = @"<!--@ThralldomDependenciesBegin-->";
            string dependenciesEnd = @"<!--@ThralldomDependenciesEnd-->";


            string replacementFormat = "<script src='{0}'></script>";
            string findPattern = @"{0}[\s\S]*{1}";

            string output = Regex.Replace(content, 
                                        string.Format(findPattern, thralldomStart, thralldomEnd), 
                                        string.Format(replacementFormat, this.mainJsPath));

            output = Regex.Replace(output, 
                                string.Format(findPattern, dependenciesStart, dependenciesEnd),
                                string.Format(replacementFormat, this.dependenciesPath));

            var dependentFiles = Regex.Match(content,
                                    string.Format(findPattern, dependenciesStart, dependenciesEnd));

            var dependencies = new List<string>();
            foreach (Match match in Regex.Matches(dependentFiles.Value, @"<script src=""(.+?.js)"">"))
	        {
                dependencies.Add(match.Groups[1].Value);
	        }
            this.BuildDepedencies(path, dependencies);

            // Attach the manifest
            string manifestPlaceholder = "<html";
            string manifestPath = "<html manifest='cache.manifest'";
            output = output.Replace(manifestPlaceholder, manifestPath);

            File.WriteAllText(path + "\\index.html", output);
        }
    }
}
