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
            string gameFolder = @"..\..\..\ProjectThralldom";
            string sitefolder = @"..\..\..\Thralldom.Web";

            bool authenticationSuccessful = true;
            AppBuilder builder = null;
            do
            {
                Console.Write("User: ");
                string user = Console.ReadLine();
                string pass = ReadPassword();
                try
                {
                    builder = new AppBuilder(user, pass, "thralldom.net", gameFolder, sitefolder);
                    authenticationSuccessful = true;
                }
                catch (FtpCommandException)
                {
                    Console.WriteLine();
                    Console.WriteLine("Invalid credentials. Try again.");
                    authenticationSuccessful = false;
                }
            }
            while (!authenticationSuccessful);

            Console.WriteLine("Authentication successful");
            Console.WriteLine();

            builder.BuildGame();
            builder.Deploy();
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
