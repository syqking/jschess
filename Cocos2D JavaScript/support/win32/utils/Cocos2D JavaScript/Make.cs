using System;
using System.Collections.Generic;
using System.Windows.Forms;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace Cocos2D_JavaScript
{
    static class Make
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
            dialog.Description = "Select the folder of the Cocos2D JavaScript project you want to compile.";

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
                System.IO.Directory.SetCurrentDirectory(filename);
                Cocos.Command("make", "", true);
                Process.Start(new ProcessStartInfo("explorer.exe ", filename + "\\build\\"));
            }


        }
    }
}
