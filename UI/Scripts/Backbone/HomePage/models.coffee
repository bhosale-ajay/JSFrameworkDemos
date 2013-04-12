@SearchableCollection = Backbone.Collection.extend
    search: (newSearchCriteria) ->
        pageSize = @searchCriteria?.pageSize ? 10
        @searchCriteria = $.extend {currentPage : 1, pageSize : pageSize}, newSearchCriteria
        @reload()
    moveToPage: (pageNumber) ->
        @searchCriteria.currentPage = pageNumber
        @reload()
    reload: ->
        promise = @fetch
            data: @searchCriteria
            timeout: 5000
            context: @
        promise.done (data, textStatus, jqXHR) ->
            @searchCriteria.totalPages = +jqXHR.getResponseHeader 'X-MP-TP'
            @searchCriteria.currentPage = +jqXHR.getResponseHeader 'X-MP-CP'
            @trigger 'reloaded'
        return promise
@MovieSlot = Backbone.Model.extend
    validation:
        'Movie.Name':
            required: true
            minLength: 4
            maxLength: 32
        'Movie.ShortSynopsis':
            required: true
            minLength: 4
@MoviePlan = Backbone.Model.extend
    url: '/api/MoviePlan'
    loadFromServer: (criteria) ->
        promise = @fetch
            data: criteria
            timeout: 5000
            context : @
        promise.done (data, textStatus, jqXHR) ->
            slots = @get 'Slots'
            for slotCounter in [0 .. slots.length - 1]
                slotModel = new MovieSlot slots[slotCounter]
                slotModel.set '_index': slotCounter
                slots[slotCounter] = slotModel
            @trigger 'reloaded'
        return promise;
    updateMovie: (index, updatedMovie) ->
        slots = @get 'Slots'
        currentSlotModel = slots[index]
        currentSlotObject = currentSlotModel.toJSON()
        sameMovie = _.find slots, (slot) -> currentSlotObject.Day is slot.get('Day') and
                            index isnt slot.get('_index') and
                            slot.get('Movie') isnt null and
                            updatedMovie.Id is slot.get('Movie').Id
        return false if sameMovie
        payload = 
            Day: currentSlotObject.Day
            LastUpdated: currentSlotObject.LastUpdated
            TimeSlot: currentSlotObject.TimeSlot
            Movie: updatedMovie
        promise = $.ajax
            dataType: 'json'
            url: "#{@url}/updateSlot?startDate=#{@get('SimpleStartDate')}"
            processData: false
            type: 'POST'
            data: JSON.stringify(payload)
            contentType: 'application/json'
            timeout: 5000
            context: @
        promise.done (data, textStatus, jqXHR) -> 
            currentSlotModel.set data
        promise.fail (jqXHR, textStatus, errorThrown)  -> 
            currentSlotModel.set $.parseJSON(jqXHR.responseText) if jqXHR.status is 409
        return promise
    attachMoiveToSlots: (timeslot, movie) ->
        promise = $.ajax
            dataType: 'json'
            url: "#{@url}/attachMoiveToSlots?startDate=#{@get('SimpleStartDate')}&timeslot=#{timeslot}"
            processData: false
            type: 'POST'
            data: JSON.stringify(movie)
            contentType: 'application/json'
            timeout: 5000
            context: @
        promise.done (updatedSlots, textStatus, jqXHR) ->
            slots = @get 'Slots'
            slotsForCurrentTimeSlot = _.filter slots, (slot) -> slot.get('TimeSlot') is timeslot
            for eachUpdatedSlotFromServer in updatedSlots
                localSlot = _.find slotsForCurrentTimeSlot, (slot) -> slot.get('Day') is eachUpdatedSlotFromServer.Day
                localSlot.set eachUpdatedSlotFromServer if localSlot
            return
        return promise