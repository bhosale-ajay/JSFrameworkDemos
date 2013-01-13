using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSFrameworks.UI.Infrastructure;
using System.Globalization;
using System.Diagnostics;

namespace JSFrameworks.UI.Backbone.Models
{
    public enum Operator
    {
        eq,
        lt,
        le,
        ge,
        gt
    }

    public class Movie
    {
        public string Id {get; set; }
        public string Name {get; set; }
        public string ShortSynopsis { get; set; }
        public string AverageRating { get;set; }
        public string ReleaseYear { get; set ;}
        public string BoxArtUrl { get; set; }
    }

    public class AttachedMovie
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string BoxArtUrl { get; set; }
        public string ShortSynopsis { get; set; }
    }

    public enum TimeSlot
    {
        Morning = 0,
        Afternoon,
        Evening,
        Night
    }

    public class Slot
    {
        public DayOfWeek Day { get; set; }
        public TimeSlot TimeSlot { get; set; }
        public AttachedMovie Movie { get; set; }
        public string LastUpdated { get; set; }

        public Slot() { }

        public Slot(DayOfWeek day, TimeSlot timeSlot)
        {
            this.Day = day;
            this.TimeSlot = timeSlot;
            this.LastUpdated = DateTime.UtcNow.Ticks.ToString();
            this.Movie = null;
        }
    }

    public class MoviePlan
    {
        public DateTime StartDate { get; set; }

        public string SimpleStartDate
        {
            get
            {
                return this.StartDate.ToString("yyyy/MM/dd", CultureInfo.InvariantCulture);
            }
            set
            {
            }
        }
        public List<Slot> Slots { get; set; }
        public MoviePlan () { }
        public MoviePlan(DateTime startDate)
        {
            this.StartDate = startDate.WeekStartDate();
            this.Slots = new List<Slot>();
            foreach (TimeSlot eachSlot in Enum.GetValues(typeof(TimeSlot)))
            {
                foreach (DayOfWeek eachDay in Enum.GetValues(typeof(DayOfWeek)))
                {
                    this.Slots.Add(new Slot(eachDay, eachSlot));
                }
            }
        }
    }

    public class MoviePlanReposiotry
    {
        private static MoviePlanReposiotry instance = null;
        private static object syncLock = new object();
        public static MoviePlanReposiotry Instance
        {
            get
            {
                if (instance == null)
                {
                    lock (syncLock)
                    {
                        if (instance == null)
                        {
                            instance = new MoviePlanReposiotry();
                        }
                    }
                }
                return instance;
            }
        }

        private List<MoviePlan> moviePlans;
        private MoviePlanReposiotry()
        {
            moviePlans = new List<MoviePlan>();
        }

        public MoviePlan GetMoviePlanForWeek(DateTime startDate)
        {
            DateTime sundayOfThatWeek = startDate.WeekStartDate();
            return moviePlans.FirstOrDefault(mp => mp.StartDate == sundayOfThatWeek);
        }

        public MoviePlan CreateMoviePlanForWeek(DateTime startDate)
        {
            DateTime sundayOfThatWeek = startDate.WeekStartDate();

            if (sundayOfThatWeek > DateTime.Now.WeekStartDate())
            {
                throw new BusinessValidationException("Cant create Movie Plan for future weeks");
            }

            MoviePlan result = moviePlans.FirstOrDefault(mp => mp.StartDate == sundayOfThatWeek);
            if (result == null)
            {
                result = new MoviePlan(sundayOfThatWeek);
                moviePlans.Add(result);
            }
            return result;
        }
    }
}
