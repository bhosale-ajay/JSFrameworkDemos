using JSFrameworks.UI.Backbone.Models;
using JSFrameworks.UI.Infrastructure;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Xml;

namespace JSFrameworks.UI.Controllers
{
    public class MoviesController : ApiController
    {
        [HttpGet]
        [PagingResponseAttribute]
        public HttpResponseMessage Search(string name, string genres, 
                                        int? releaseYear,
                                        Operator? releaseYearOperator,                           
                                        double? averageRating,                          
                                        Operator? averageRatingOperator,
                                        [FromUri]PagingInformation pagingInformation)
        {
            var result = new List<Movie>();
            var searchUrl = GetSearchUrl(name, genres, releaseYear, releaseYearOperator, averageRating, averageRatingOperator, pagingInformation);
            int totalRecords = 0;
            int currentRecords = 0;
            XmlDocument document = GetDataFromUrl(searchUrl, 5000);
            XmlNamespaceManager nsManager = new XmlNamespaceManager(document.NameTable);
            nsManager.AddNamespace("root", @"http://www.w3.org/2005/Atom");
            nsManager.AddNamespace("m", @"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata");
            nsManager.AddNamespace("d", @"http://schemas.microsoft.com/ado/2007/08/dataservices");

            totalRecords = int.Parse(document.SelectSingleNode("root:feed/m:count", nsManager).InnerText);
            foreach (XmlElement entryNode in document.SelectNodes("root:feed/root:entry", nsManager))
            {
                result.Add(new Movie()
                {
                    Id = entryNode.SelectSingleNode("m:properties/d:Id", nsManager).InnerText,
                    Name = entryNode.SelectSingleNode("root:title", nsManager).InnerText,
                    ShortSynopsis = entryNode.SelectSingleNode("root:summary", nsManager).InnerText,
                    ReleaseYear = entryNode.SelectSingleNode("m:properties/d:ReleaseYear", nsManager).InnerText,
                    AverageRating = entryNode.SelectSingleNode("m:properties/d:AverageRating", nsManager).InnerText,
                    BoxArtUrl = GetImageUrl(entryNode.SelectSingleNode("root:content/@src", nsManager).Value)
                });
                currentRecords++;
            }
            pagingInformation.UpdatePageInformation(currentRecords == 0 ? 0 : totalRecords);
            return this.Request.CreateResponse<List<Movie>>(HttpStatusCode.OK, result);
        }

        private string GetImageUrl(string imageUrl)
        {
            return BackboneSettings.IsLocal?
                "/Content/Images" + imageUrl.Substring(imageUrl.LastIndexOf('/'))
                    :
                imageUrl;
            
                
        }

        [NonAction]
        private string GetSearchUrl(string name, string genres,
                                        int? releaseYear,
                                        Operator? releaseYearOperator,
                                        double? averageRating,
                                        Operator? averageRatingOperator,
                                        PagingInformation pagingInformation)
        {
            if (BackboneSettings.IsLocal)
            {
                var pageNumber = pagingInformation.CurrentPage % 4;
                if (pageNumber == 0)
                {
                    pageNumber = 4;
                }
                return string.Format(BackboneSettings.LocalPath, pageNumber);
            }

            string genresCriteria = string.Empty;
            if (!string.IsNullOrEmpty(genres))
            {
                genresCriteria = string.Format("Genres('{0}')/", genres);
            }
            string whereCriteria = string.Empty;
            if (releaseYear.HasValue && releaseYear > 0)
            {
                whereCriteria = string.Format("(ReleaseYear {0} {1})", releaseYearOperator ?? Operator.eq, releaseYear);
            }
            if (averageRating.HasValue && averageRating > 0)
            {
                if (!string.IsNullOrEmpty(whereCriteria))
                {
                    whereCriteria += " and ";
                }
                whereCriteria += string.Format("(AverageRating {0} {1})", averageRatingOperator ?? Operator.eq, averageRating);
            }
            if (!string.IsNullOrEmpty(name))
            {
                if (!string.IsNullOrEmpty(whereCriteria))
                {
                    whereCriteria += " and ";
                }
                whereCriteria += string.Format("(substringof('{0}',Name))", name);
            }
            if (!string.IsNullOrEmpty(whereCriteria))
            {
                whereCriteria = string.Format("$filter=({0})", whereCriteria);
            }

            return string.Format(@"http://odata.netflix.com/catalog/{0}Titles()?{1}&$top={2}&$skip={3}&$orderby=AverageRating desc&$select=Id,ReleaseYear,AverageRating&$inlinecount=allpages", 
                                    genresCriteria, 
                                    whereCriteria,
                                    pagingInformation.PageSize, 
                                    pagingInformation.SkipCount);
        }

        [NonAction]
        private XmlDocument GetDataFromUrl(string url, int timeOutInMiliSeconds)
        {
            XmlDocument result = new XmlDocument();

            if (BackboneSettings.IsLocal)
            {
                result.Load(url);
            }
            else
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                request.Timeout = timeOutInMiliSeconds;
                HttpWebResponse response = request.GetResponse() as HttpWebResponse;
                using (Stream responseStream = response.GetResponseStream())
                {
                    XmlTextReader reader = new XmlTextReader(responseStream);
                    result.Load(reader);
                }
            }
            return result;
        }
    }
}