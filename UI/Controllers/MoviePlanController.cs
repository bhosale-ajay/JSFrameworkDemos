using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using JSFrameworks.UI.Backbone.Models;

namespace JSFrameworks.UI.Controllers
{
    public class MoviePlanController : ApiController
    {
        public MoviePlan Get([FromUri]DateTime startDate)
        {
            var result = MoviePlanReposiotry.Instance.GetMoviePlanForWeek(startDate);
            if (result == null)
            {
                result = MoviePlanReposiotry.Instance.CreateMoviePlanForWeek(startDate);
            }
            return result;
        }

        [HttpPost]
        public HttpResponseMessage UpdateSlot([FromUri]DateTime startDate, Slot updatedSlot)
        {
            var moviePlan = MoviePlanReposiotry.Instance.GetMoviePlanForWeek(startDate);
            if(moviePlan == null)
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
            }
            var slot = moviePlan.Slots.FirstOrDefault(s => s.Day == updatedSlot.Day && s.TimeSlot == updatedSlot.TimeSlot);
            if(slot == null)
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
            }
            if(!slot.LastUpdated.Equals(updatedSlot.LastUpdated))
            {
                return this.Request.CreateResponse<Slot>(System.Net.HttpStatusCode.Conflict, slot);
            }

            if (updatedSlot.Movie != null)
            {
                var sameMovie = moviePlan.Slots
                                            .FirstOrDefault(otherSlot => 
                                                otherSlot.Day == slot.Day
                                                &&
                                                otherSlot.TimeSlot != slot.TimeSlot
                                                &&
                                                otherSlot.Movie != null
                                                &&
                                                otherSlot.Movie.Id.Equals(updatedSlot.Movie.Id));
                if (sameMovie != null)
                {
                    return new HttpResponseMessage(System.Net.HttpStatusCode.BadRequest);
                }
            }


            slot.Movie = updatedSlot.Movie;
            slot.LastUpdated = DateTime.Now.Ticks.ToString();
            return this.Request.CreateResponse<Slot>(System.Net.HttpStatusCode.Accepted, slot);
        }

        [HttpPost]
        public HttpResponseMessage AttachMoiveToSlots([FromUri]DateTime startDate, 
                                                      [FromUri]TimeSlot timeSlot,
                                                      AttachedMovie movie)
        {
            var updatedSlots = new List<Slot>();

            var moviePlan = MoviePlanReposiotry.Instance.GetMoviePlanForWeek(startDate);
            if (moviePlan == null)
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
            }

            var slots = moviePlan.Slots.Where(s => s.TimeSlot == timeSlot);
            foreach (var eachSlot in slots)
            {
                if (eachSlot.Movie == null)
                {
                    var sameMovie = moviePlan.Slots
                                            .FirstOrDefault(otherSlot =>
                                                otherSlot.Day == eachSlot.Day
                                                &&
                                                otherSlot.Movie != null
                                                &&
                                                otherSlot.Movie.Id.Equals(movie.Id));

                    if (sameMovie == null)
                    {
                        eachSlot.Movie = movie;
                        eachSlot.LastUpdated = DateTime.Now.Ticks.ToString();
                        updatedSlots.Add(eachSlot);
                    }
                }
            }

            return this.Request.CreateResponse<List<Slot>>(System.Net.HttpStatusCode.Accepted, updatedSlots);
        }
    }
}