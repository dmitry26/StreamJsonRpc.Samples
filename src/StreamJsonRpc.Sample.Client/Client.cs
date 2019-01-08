using System;
using System.IO.Pipes;
using System.Threading.Tasks;
using StreamJsonRpc;

namespace StreamJsonRpc.Sample.Client
{
    class Client
    {
        static void Main(string[] args)
        {
			Console.Title = System.IO.Path.GetFileNameWithoutExtension(System.Reflection.Assembly.GetExecutingAssembly().Location);

			MainAsync().GetAwaiter().GetResult();

			Console.ReadLine();
        }

        static async Task MainAsync()
        {
            Console.WriteLine("Connecting to server...");

            using (var stream = new NamedPipeClientStream(".", "StreamJsonRpcSamplePipe", PipeDirection.InOut, PipeOptions.Asynchronous))
            {
                await stream.ConnectAsync();
                Console.WriteLine("Connected. Sending request...");
				
				var jsonRpc = JsonRpc.Attach(stream);
				var calc = jsonRpc.Attach<ICalculator>();
				var sum2 = await calc.Add(2,4);
				Console.WriteLine($"2 + 4 = {sum2}");

				int sum = await jsonRpc.InvokeAsync<int>("Add", 3, 5);
                Console.WriteLine($"3 + 5 = {sum}");
                Console.WriteLine("Terminating stream...");
            }
        }
    }

	public interface ICalculator
	{
		Task<int> Add(int a,int b);		
	}
}
