using System;
using System.Collections.Generic;
using System.Windows.Forms;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using IWshRuntimeLibrary;

namespace Cocos2D_JavaScript
{
    static class Create
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main(String[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            FolderBrowserDialog dialog = new FolderBrowserDialog();
            dialog.Description = "Create and select the folder for the new Cocos2D JavaScript project you want to create.";
            String filename;

            if (args.Length > 0)
            {
                filename = args[0];
            }
            else
            {
                filename = (dialog.ShowDialog() == DialogResult.OK) ? dialog.SelectedPath : null;
            }

            if (filename != null)
            {
                String exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

                String oldDir = System.IO.Directory.GetCurrentDirectory();
                System.IO.Directory.SetCurrentDirectory(filename);
                Cocos.Command("new", ".", true);

                // Create shortcuts
                Create.Shortcut(exeDir + @"\Serve project.exe", filename + @"\Serve project.lnk");
                Create.Shortcut(exeDir + @"\Compile project.exe", filename + @"\Compile project.lnk");

                Process.Start(new ProcessStartInfo("explorer.exe", filename));
            }
        }

        static void Shortcut(String source, String dest, String description="")
        {
            WshShell wsh = new WshShellClass();

            IWshRuntimeLibrary.IWshShortcut shortcut = (IWshRuntimeLibrary.IWshShortcut)wsh.CreateShortcut(dest);
            shortcut.Arguments = ".";
            shortcut.TargetPath = source;

            shortcut.Save();
        }

    }
}
