using System;
using System.Collections.Generic;
using System.Text;
using System.Diagnostics;
using System.Reflection;
using System.IO;

namespace Cocos2D_JavaScript
{
    class Cocos
    {
        public static void Command(String command, String args = "", Boolean wait=false)
        {
            String exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            ProcessStartInfo cmd = new ProcessStartInfo(exeDir + "\\cocos.bat", command + " " + args);
            Process proc = Process.Start(cmd);

            if (wait)
            {
                proc.WaitForExit();
            }
        }
    }
}
