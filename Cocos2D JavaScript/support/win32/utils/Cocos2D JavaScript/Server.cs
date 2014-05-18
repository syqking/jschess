using System;
using System.Collections.Generic;
using System.Windows.Forms;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace Cocos2D_JavaScript
{
    static class Server
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
            dialog.Description = "Select the folder of the Cocos2D JavaScript project you want to run a development Web server for.";

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
                Cocos.Command("server");
            }
        }
    }
}
