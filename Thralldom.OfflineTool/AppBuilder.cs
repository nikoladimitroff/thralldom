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

        private List<Stream> streams;

        private string[] DirectoryMasks = { "/ProjectThralldom", "/Content", "/Scripts" };
        private string PhysicalRoot = "ProjectThralldom";
        private string Root = "game/";

        public AppBuilder(string user, string pass, string domain)
        {

            this.streams = new List<Stream>();

            this.client = new FtpClient();
            client.Credentials = new System.Net.NetworkCredential(user, pass, domain);
            client.Host = domain;
            client.Connect();
        }

        public void Build(string path)
        {
            GenerateManifest(path);
            BuildIndex(path);
        }

        public void Deploy(string path)
        {
            TraverseFileSystem(path + "\\Scripts\\implementations", CreateDirectory, UploadFile);
            TraverseFileSystem(path + "\\Content", CreateDirectory, UploadFile);
            string[] inroot = { "index.html", "app.css", "thralldom.min.js", "cache.manifest" };
            foreach (var file in inroot)
            {
                this.UploadFile(path + "\\" +  file);
            }


            while (this.streams.Count != 0)
            {
                Thread.Sleep(50);
            }

            //client.Disconnect();
            //client.Dispose();
        }

        
        private string NormalizeFileName(string file)
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

            return normalized.Replace(PhysicalRoot, ""); ;
        }

        private string NormalizeFileNameRooted(string file)
        {
            return this.Root + this.NormalizeFileName(file);
        }

        private int connectionLimit = 15;
        private void UploadFile(string file)
        {
            while (this.streams.Count > this.connectionLimit)
            {
                Thread.Sleep(50);
            }

            string normalized = this.NormalizeFileNameRooted(file);
            Stream stream = client.OpenWrite(normalized, FtpDataType.Binary);

            List<string> textFormats = new List<string>() { ".js", ".anim", ".script", ".srt", };

            byte[] bytes;
            if (textFormats.IndexOf(Path.GetExtension(file)) != -1)
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

        private void CreateDirectory(string dir)
        {
            this.client.CreateDirectory(this.NormalizeFileNameRooted(dir));
        }

        private void GenerateManifest(string path)
        {
            string header = "CACHE MANIFEST";
            string timestamp = "# " + DateTime.UtcNow.ToString();

            // Pages
            string pages = "# Pages\nindex.html\napp.css";

            // Code
            string[] libs = { "three.min.js", "ammo.small.js", "jquery.documentReady.js", "stats.min.js" };
            string code = "# Code\nthralldom.min.js";
            code += libs.Select((x) => "/Scripts/implementations/" + x).Aggregate(string.Empty, (previous, current) => previous + "\n" + current);

            // Content
            StringBuilder content = new StringBuilder();
            content.AppendLine("# Content");
            string contentFolder = path + "\\Content\\";
            TraverseFileSystem(contentFolder, (dir) => { }, (file) =>
            {
                string unixFileName = this.NormalizeFileName(file);
                content.AppendLine(unixFileName);
            });

            // Build everything
            string output = String.Format("{0}\n{1}\n\n{2}\n\n{3}\n\n{4}", header, timestamp, pages, code, content.ToString());
            File.WriteAllText(path + "\\cache.manifest", output);

        }

        private void TraverseFileSystem(string path, Action<string> dirCallback, Action<string> fileCallback)
        {
            foreach (var dir in Directory.GetDirectories(path))
            {
                dirCallback(dir);
                TraverseFileSystem(dir, dirCallback, fileCallback);
            }
            foreach (var file in Directory.GetFiles(path))
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
            string replacement = "<script src='thralldom.min.js'></script>";
            string pattern = string.Format(@"{0}[\s\S]*{1}", thralldomStart, thralldomEnd);
            string output = Regex.Replace(content, pattern, replacement);

            // Attach the manifest
            string manifestPlaceholder = "<!--@ThralldomCacheManifest-->";
            string manifestPath = "manifest='cache.manifest'";
            output = output.Replace(manifestPlaceholder, manifestPath);

            File.WriteAllText(path + "\\index.html", output);
        }
    }
}
