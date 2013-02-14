var SearchableCollection = Backbone.Collection.extend({
    searchCriteria: {},
    search: function (newSearchCriteria) {
        var pageSize = this.searchCriteria.pageSize ? this.searchCriteria.pageSize : 10;
        this.searchCriteria = $.extend(
                        {currentPage : 1, pageSize : pageSize},
                        newSearchCriteria);
        return this.reload();
    },
    moveToPage: function (pageNumber) {
        this.searchCriteria.currentPage = pageNumber;
        return this.reload();
    },
    reload: function () {
        var promise = this.fetch({ data: this.searchCriteria, timeout: 5000, context: this });
        promise.done(function (data, textStatus, jqXHR) {
            this.searchCriteria.totalPages = jqXHR.getResponseHeader('X-MP-TP') * 1;
            this.searchCriteria.currentPage = jqXHR.getResponseHeader('X-MP-CP') * 1;
            this.trigger('reloaded');
        });
        return promise;
    }
});
var MovieSlot = Backbone.Model.extend({
    validation: {
        'Movie.Name': {
            required: true,
            minLength: 4,
            maxLength : 32
        },
        'Movie.ShortSynopsis': {
            required: true,
            minLength : 4
        }
    }
});
var MoviePlan = Backbone.Model.extend({
    url: '/api/MoviePlan',
    loadFromServer: function (criteria) {
        var promise = this.fetch({ data: criteria, timeout: 5000, context : this });
        promise.done(function (data, textStatus, jqXHR) {
            var slots = this.get('Slots');
            for (var slotCounter = 0; slotCounter < slots.length; slotCounter++) {
                var slotModel = new MovieSlot(slots[slotCounter]);
                slotModel.set({ '_index': slotCounter });
                slots[slotCounter] = slotModel;
            }
            this.trigger('reloaded');
        });
        return promise;
    },
    updateMovie: function (index, updatedMovie) {
        var slots = this.get('Slots');
        var currentSlotModel = slots[index];
        var currentSlotObject = currentSlotModel.toJSON();

        var sameMovie = _.find(slots, function (slot) {
            var movie = slot.get('Movie');
            return currentSlotObject.Day == slot.get('Day') &&
                            index != slot.get('_index') &&
                            movie != null &&
                            updatedMovie.Id == movie.Id;
        });
        if (sameMovie) {
            return false;
        }
        var payload = {
            Day: currentSlotObject.Day,
            LastUpdated: currentSlotObject.LastUpdated,
            TimeSlot: currentSlotObject.TimeSlot,
            Movie: updatedMovie
        };
        var promise = $.ajax({
            dataType: 'json',
            url: this.url + '/updateSlot?startDate=' + this.get('SimpleStartDate'),
            processData: false,
            type: 'POST',
            data: JSON.stringify(payload),
            contentType: 'application/json',
            timeout: 5000,
            context: this
        });
        promise.done(function (data, textStatus, jqXHR) {
            currentSlotModel.set(data);
        });
        promise.fail(function (jqXHR, textStatus, errorThrown) {
            if (jqXHR.status == 409) {
                var updatedModel = $.parseJSON(jqXHR.responseText);
                currentSlotModel.set(updatedModel);
            }
        });
        return promise;
    },
    attachMoiveToSlots: function (timeslot, movie) {
        var promise = $.ajax({
            dataType: 'json',
            url: this.url + '/attachMoiveToSlots?startDate=' + this.get('SimpleStartDate') + '&timeslot=' + timeslot,
            processData: false,
            type: 'POST',
            data: JSON.stringify(movie),
            contentType: 'application/json',
            timeout: 5000,
            context: this
        });

        promise.done(function (updatedSlots, textStatus, jqXHR) {
            var slots = this.get('Slots');
            var slotsForCurrentTimeSlot = _.filter(slots, function (slot) {
                return slot.get('TimeSlot') == timeslot;
            });
            _.each(updatedSlots, function (updatedSlotFromServer) {
                var updateSlot = _.find(slotsForCurrentTimeSlot, function (slot) {
                    return slot.get('Day') == updatedSlotFromServer.Day;
                });
                if (updateSlot) {
                    updateSlot.set(updatedSlotFromServer);
                }
            });
        });

        return promise;
    }
});