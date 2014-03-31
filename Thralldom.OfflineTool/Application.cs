using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Net.FtpClient;
using System.Security;

namespace Thralldom.OfflineTool
{
    /// <summary>
    /// An all - rounder tool that does various prebuild jobs. For now, it only creates the TS class that holds all our content to avoid mistypings.
    /// </summary>
    class Application
    {
        static void Main(string[] args)
        {
            string defaultFolder = @"..\..\..\ProjectThralldom";

            Console.Write("User: ");
            string user = Console.ReadLine();
            string pass = ReadPassword();
            var builder = new AppBuilder(user, pass, "thralldom.net");
            builder.Build(defaultFolder);
            builder.Deploy(defaultFolder);
        }

        public static string ReadPassword()
        {
            // Instantiate the secure string.
            string password = "";
            ConsoleKeyInfo key;

            Console.Write("Enter password: ");
            do
            {
                key = Console.ReadKey(true);

                // Append the character to the password.
                password += key.KeyChar;
                Console.Write('*');

                // Exit if Enter key is pressed.
            } while (key.Key != ConsoleKey.Enter);
            Console.WriteLine();

            return password.Trim();
        }

    }
}
