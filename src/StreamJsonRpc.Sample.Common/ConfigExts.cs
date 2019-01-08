using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace StreamJsonRpc.Sample.Common
{
	public static class ConfigExts
	{
		public static IConfigurationRoot AppSettings(string filename = null,bool optional = false,bool reloadOnChange = false)
		{
			return new ConfigurationBuilder()			
			.SetBasePath(AppContext.BaseDirectory)
			.AddJsonFile(string.IsNullOrEmpty(filename) ? "appsettings.json" : filename,optional,reloadOnChange)
			.Build();
		}

		public static string ConnectionString(this IConfigurationRoot cfg,string name = null)
		{
			return cfg.GetConnectionString(name ?? "Default");
		}
	}
}
