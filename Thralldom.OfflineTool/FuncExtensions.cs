using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Thralldom.OfflineTool
{
    public static class FuncExtensions
    {
        public static Action<T2> Partial<T1, T2>(this Action<T1, T2> action, T1 argumentValue)
        {
            return (x) => action(argumentValue, x);
        }
    }
}