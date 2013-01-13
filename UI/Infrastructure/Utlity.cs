using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http.Filters;
using System.Diagnostics;
using System.Web.Http;
using System.Net.Http;
using System.Net;

namespace JSFrameworks.UI.Infrastructure
{
    public static class BackboneSettings
    {
        public static bool IsLocal { get; set; }
        public static string LocalPath { get; set; }
    }

    public class PagingResponseAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext)
        {
            base.OnActionExecuted(actionExecutedContext);
            var pagingInformation = actionExecutedContext.ActionContext.ActionArguments["pagingInformation"] as PagingInformation;
            if (pagingInformation != null && actionExecutedContext.Exception == null)
            {
                actionExecutedContext.Response.Headers.Add("X-MP-TP", pagingInformation.TotalPages.ToString());
                actionExecutedContext.Response.Headers.Add("X-MP-CP", pagingInformation.CurrentPage.ToString());
            }
        }
    }

    public class ExceptionHandlingAttribute : ExceptionFilterAttribute
    {
        public override void  OnException(HttpActionExecutedContext context)
        {
            if (context.Exception is BusinessValidationException)
            {
                throw new HttpResponseException(new HttpResponseMessage(HttpStatusCode.Forbidden)
                {
                    Content = new StringContent(context.Exception.Message),
                    ReasonPhrase = "Validation Exception"
                });
            }
            throw new HttpResponseException(new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent("An error occurred, please try again or contact the administrator."),
                ReasonPhrase = "Critical Exception"
            });
        }
    }

    public class BusinessValidationException : Exception
    {
        public BusinessValidationException(string message) : base(message)
        {
        }
    }

    public class PagingInformation
    {
        private const int maxPageSize = 20;
        private const int maxTotalPages = 25;

        int pageSize = maxPageSize;
        public int PageSize
        {
            get
            {
                return this.pageSize;
            }
            set
            {
                this.pageSize = (0 < value && value <= maxPageSize)? value : maxPageSize;
            }
        }

        int currentPage = 1;
        public int CurrentPage
        {
            get
            {
                return this.currentPage;
            }
            set
            {
                this.currentPage = (0 <= value && value <= maxTotalPages) ? value : maxTotalPages;
            }
        }

        int totalPages = 0;
        public int TotalPages
        {
            get
            {
                return this.totalPages;
            }
            private set
            {
                this.totalPages = value <= maxTotalPages? value : maxTotalPages;
            }
        }

        public int SkipCount
        {
            get
            {
                return this.currentPage > 0 ?(this.currentPage - 1) * this.PageSize : 0;
            }
        }

        public void UpdatePageInformation(int totalRecords)
        {
            this.TotalPages = (totalRecords / this.PageSize) + (totalRecords % this.PageSize > 0? 1 : 0);
            if (this.CurrentPage > this.TotalPages)
            {
                this.CurrentPage = TotalPages;
            }
        }
    }
}