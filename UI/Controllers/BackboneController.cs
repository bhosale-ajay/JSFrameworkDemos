using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace JSFrameworks.UI.Controllers
{
    public class BackboneController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.CurrentDate = DateTime.Now.ToString("yyyy/MM/dd", CultureInfo.InvariantCulture);
            return View();
        }
    }
}
