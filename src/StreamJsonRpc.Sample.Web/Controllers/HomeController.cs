using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using StreamJsonRpc;

namespace StreamJsonRpc.Sample.Web.Controllers
{
	[Route("[controller]")]
	public class HomeController : Controller
    {
		[HttpGet("[action]")]
        public async Task<IActionResult> Socket()
        {
            if (this.HttpContext.WebSockets.IsWebSocketRequest)
            {
				await Task.Delay(5000);
				var socket = await this.HttpContext.WebSockets.AcceptWebSocketAsync();				
				var jsonRpc = new JsonRpc(new WebSocketMessageHandler(socket), new JsonRpcServer());				
				jsonRpc.StartListening();
				
				try
				{
					await jsonRpc.Completion;
				}
				catch (Exception x)
				{
				}

                return new EmptyResult();
            }
            
            return new BadRequestResult();
        }
    }	
}
