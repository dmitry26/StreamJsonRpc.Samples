using System;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Threading;
using StreamJsonRpc.Sample.Common;

namespace StreamJsonRpc.Sample.WebSocketClient
{
    class Program
    {
		static void Main(string[] args)
		{
			Console.Title = System.IO.Path.GetFileNameWithoutExtension(System.Reflection.Assembly.GetExecutingAssembly().Location);

			RunAsyn().GetAwaiter().GetResult();
			
			Console.ReadLine();
		}

		private static async Task RunAsyn()
		{			
			using (var ws = new ClientWebSocket())
			{				
				await ws.ConnectAsync(new Uri(ConfigExts.AppSettings().ConnectionString()),default);

				using (var clientJsonRpc = new JsonRpc(new WebSocketMessageHandler(ws)))
				{
					clientJsonRpc.StartListening();

					var calc = clientJsonRpc.Attach<ICalculator>();

					var sum2 = await calc.Add(2,4);
					Console.WriteLine($"2 + 4 = {sum2}");
					
					var sum3 = await calc.Add(2.1,4.5);
					Console.WriteLine($"2.1 + 4.5 = {sum3}");

					var sum4 = await calc.TestAdd(2.2,"5.5");
					Console.WriteLine($"2.2 + 5.5 = {sum4}");

					await Test1(calc);

					await ws.CloseOutputAsync(WebSocketCloseStatus.NormalClosure,"Client initiated close",default);
				}				
			}
		}

		static async Task Test1(ICalculator calc)
		{
			var rand = new Random((int)DateTime.Now.Ticks);
			var sw = Stopwatch.StartNew();			

			for (int i = 0; i < 15; ++i)
			{
				var x = rand.Next(0,100);
				var y = rand.Next(-50,50);				
				sw.Restart();
				var res = await calc.Add(x,y);
				Console.WriteLine($"Add: x = {x}, y = {y}, res = {res}, duration = {sw.Elapsed.TotalMilliseconds}ms");			
			}
		}

		static async Task Test2(ICalculator calc)
		{
			var rand = new Random((int)DateTime.Now.Ticks);
			var sw = Stopwatch.StartNew();

			for (int i = 0; i < 15; ++i)
			{
				var x = rand.NextDouble() * 100;
				var y = rand.Next() * 100 - 50;
				sw.Restart();
				var res = await calc.Add(x,y);
				Console.WriteLine($"Add: x = {x}, y = {y}, res = {res}, duration = {sw.Elapsed.TotalMilliseconds}ms");
			}
		}
	}

	public interface ICalculator
	{
		Task<int> Add(int a,int b);

		Task<double> Add(double a,double b);

		[JsonRpcMethod("Add")]
		Task<double> TestAdd(double a,string b);
	}
}
