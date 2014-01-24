using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Thralldom.OfflineTool
{
    /// <summary>
    /// An all - rounder tool that does various prebuild jobs. For now, it only creates the TS class that holds all our content to avoid mistypings.
    /// </summary>
    class Program
    {
        static readonly string RegexPattern = @"//@StartContent[\s\S]*//@EndContent";
        static void Main(string[] args)
        {

            // Get the project folder and the ContentLib.ts file
            string folder = args[0],
                destination = args[1];


            CreateContentLibrary(folder, destination);
        }

        private static void CreateContentLibrary(string folder, string destination)
        {
            // Enumerate trough all directories and create a new object for each one. Enumerate trough all files and add them as properties to their parent's folder
            StringBuilder content = new StringBuilder();
            content.AppendLine(@"//@StartContent");
            content.Append("\t\t");
            foreach (var dir in Directory.EnumerateDirectories(folder))
            {

                string name = GetDirName(dir);
                content.AppendFormat("public static {0} = {{ ", name);
                // Recursively add other folders as sub properties
                AddPropertiesRecursively(content, dir, name);
                content.Remove(content.Length - 2, 1);
                content.AppendLine(" };");
            }
            content.AppendLine();
            content.Append("\t\t" + @"//@EndContent");

            string fileContent = File.ReadAllText(destination);
            fileContent = Regex.Replace(fileContent, RegexPattern, content.ToString());

            File.WriteAllText(destination, fileContent);
        }

        private static void AddPropertiesRecursively(StringBuilder content, string dir, string dirName)
        {
            foreach (var folder in Directory.EnumerateDirectories(dir))
            {
                string folderName = GetDirName(folder);
                content.AppendFormat("{0}: {{ ", folderName);
                AddPropertiesRecursively(content, folder, folderName);
                content.Append("},");
            }

            foreach (var file in Directory.EnumerateFiles(dir))
            {
                string fileName = Path.GetFileNameWithoutExtension(file) + Path.GetExtension(file).Remove(0, 1).ToUpperInvariant();
                content.AppendFormat("{0}: \"{1}\", ", fileName, "Content/" + dirName + "/" + Path.GetFileName(file));
            }
        }

        private static string GetDirName(string directory)
        {
            return directory.Replace(Path.GetDirectoryName(directory), "").Remove(0, 1);
        }
    }
}
