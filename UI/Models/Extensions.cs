using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSFrameworks.UI.Backbone.Models
{
    public static class DateExtensionsMethods
    {
        public static DateTime WeekStartDate(this DateTime date)
        {
            if (date.DayOfWeek != DayOfWeek.Sunday)
            {
                date = date.AddDays((int)date.DayOfWeek * -1);
            }
            return DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        }
        
        /*
        public static DateTime WeekEndDate(this DateTime date)
        {
            if (date.DayOfWeek != DayOfWeek.Saturday)
            {
                date = date.AddDays((int)DayOfWeek.Saturday - (int)date.DayOfWeek);
            }

            return GetDatePart(date);
        }

        public static String ToPrometheusSystemFormat(this DateTime date)
        {
            return date.ToString("yyyy/MM/dd", CultureInfo.InvariantCulture);
        }

        public static String ToPrometheusDisplayFormat(this DateTime date)
        {
            return date.ToString("MM/dd/yyyy", CultureInfo.InvariantCulture);
        }

        public static DateTime GetDatePart(this DateTime date)
        {
            return new DateTime(date.Year, date.Month, date.Day);
        }
        */ 
    }
}
