using JSFrameworks.UI.Infrastructure;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace JSFrameworks.UI
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();

            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            BackboneSettings.IsLocal = "true".Equals(ConfigurationManager.AppSettings["Local"], StringComparison.InvariantCultureIgnoreCase);
            BackboneSettings.LocalPath = ConfigurationManager.AppSettings["LocalPath"];
        }
    }
}