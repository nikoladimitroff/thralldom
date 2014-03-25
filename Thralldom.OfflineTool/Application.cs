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
    class Application
    {
        // Content lib generation
        static readonly string ContentStart = @"//@StartContent";
        static readonly string ContentEnd = @"//@EndContent";
        static readonly string RegexPattern = ContentStart +  @"[\s\S]*" + ContentEnd;

        // Animation fix
        static readonly string ModelsDirectory = @"\Models";
        static readonly string AnimationsLiteral = "\"animations\"";
        static readonly string AnimationLiteral = "\"animation\"";
        static readonly string AnimationRegexPattern = AnimationsLiteral + @"\s*:\s*\[[\s\S]*\]";

        static void Main(string[] args)
        {
            //string defaultFolder = @"E:\Developer\ProjectThralldom\ProjectThralldom\Content";

            // Get the project folder and the ContentLib.ts file
            string folder = args[0],
                destination = args[1];

            //CreateContentLibrary(folder, destination);
            //FixModelFilesAnimation(folder);
        }

        private static void FixModelFilesAnimation(string folder)
        {
            string absolutePath = folder + Application.ModelsDirectory;

            foreach (string model in Directory.EnumerateFiles(absolutePath, "*.js", SearchOption.AllDirectories))
            {
                string content = File.ReadAllText(model);
                int index = content.IndexOf(AnimationsLiteral);
                if (index != -1)
                {
                    int startBraceIndex = -1;
                    int bracesCount = 0;
                    for (int i = index; i < content.Length; i++)
                    {
                        if (content[i] == '{')
                        {
                            if (startBraceIndex == -1)
                            {
                                startBraceIndex = i;
                            }

                            bracesCount++;
                        }
                        else if (content[i] == '}')
                        {
                            bracesCount--; 
                        }

                        if (startBraceIndex != -1 && bracesCount == 0)
                        {
                            string animations = Application.AnimationLiteral + ": " + content.Substring(startBraceIndex, i - startBraceIndex + 1);
                            content = Regex.Replace(content, Application.AnimationRegexPattern, animations);
                            break;
                        }
                    }
                    File.WriteAllText(model, content);
                }
            }
        }

        #region ContentLib
        private static void CreateContentLibrary(string folder, string destination)
        {
            // Enumerate trough all directories and create a new object for each one. Enumerate trough all files and add them as properties to their parent's folder
            StringBuilder content = new StringBuilder();
            content.AppendLine(Application.ContentStart);
            foreach (var dir in Directory.EnumerateDirectories(folder))
            {

                string name = GetDirName(dir);
                content.AppendFormat("\t\tpublic static {0} = {{ ", name);
                // Recursively add other folders as sub properties
                AddPropertiesRecursively(content, dir, name);
                content.AppendLine(" };");
            }
            content.AppendLine();
            content.Append("\t\t" + ContentEnd);

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
                AddPropertiesRecursively(content, folder, dirName + "/" + folderName);
                content.Append("},");
            }

            foreach (var file in Directory.EnumerateFiles(dir))
            {
                string fileName = Path.GetFileNameWithoutExtension(file) + Path.GetExtension(file).Remove(0, 1).ToUpperInvariant();
                fileName = fileName.Replace("_", "");
                content.AppendFormat("{0}: \"{1}\", ", fileName, "Content/" + dirName + "/" + Path.GetFileName(file));
            }
        }

        private static string GetDirName(string directory)
        {
            return directory.Replace(Path.GetDirectoryName(directory), "").Remove(0, 1);
        }

        #endregion
    }
}
