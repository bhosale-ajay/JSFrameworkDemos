@MoviePlanView = Backbone.View.extend(window.DragDropView).extend
    initialize: ->
        @model.on 'reloaded', @renderMoviePlan, @
        @loadMoviePlanAndHandleResponse()
        @makeRowHeadersDroppbale()
    loadMoviePlanAndHandleResponse: ->
        util.startLoadingIndicator();
        promise = @model.loadFromServer 'startDate': window.CURRENT_DATE
        promise
            .always(util.stopLoadingIndicator)
            .fail(util.handleError)
    renderMoviePlan: ->
        for slot in @model.get('Slots')
            slotView = new SlotView 
                            model : slot
                            el : @$ '#' + slot.get('TimeSlot') + '_' + slot.get('Day')
                            parentModel: @model
            slotView.render()
    makeRowHeadersDroppbale: ->
        @makeDroppable @$('td.showtime'), (rowHeader, movie) ->
            timeslot = rowHeader.data 'timeslot'
            console.log timeslot
            @model.attachMoiveToSlots timeslot, movie

@MovieEditDialog = Backbone.View.extend(window.FormView).extend
    events:
        'click #submit': 'submit'
        'blur input': 'validate'
    modelFieldMapping:
        'Movie.Name': '#inputName'
        'Movie.ShortSynopsis': '#inputShortSynopsis'
    show: ->
        modelObject = @model.toJSON()
        generaredHtml = util.applyTemplate 'movieEditDialog', modelObject
        @$el.html generaredHtml
        parentContainer = $ window.body
        parentContainer.append @$el
        Backbone.Validation.bind @
        @$el.modal().on 'hidden', =>
            Backbone.Validation.unbind @
            parentContainer.remove @$el
    submit: (e) ->
        e.preventDefault()
        result = @validate()
        if (result)
            updatedMovie = _.extend {}, @model.get('Movie'), @getFormModel().Movie
            @options.parentView.updateMovie updatedMovie
            @$el.modal 'hide'
        return false
    validate: ->
        !@.model.validate 'Movie': @getFormModel().Movie

@SlotView = Backbone.View.extend(DragDropView).extend
    initialize: ->
        @model.on 'change', @render, @
        @makeDroppable @$el, (cell, droppedMovie) -> @updateMovie(droppedMovie)
    render: ->
        modelObject = @model.toJSON()
        generaredHtml = util.applyTemplate 'moviePlanSlot', modelObject
        @$el.html generaredHtml
        movie = modelObject.Movie
        if movie
            movieImage = @$ 'img'
            @makeDraggable movie, 'movieDragHelperTemplate', movieImage
            movieImage.dblclick => @onMovieClick()
        return @
    onMovieClick: ->
        movieEditDialog = new MovieEditDialog model: @model, parentView: @
        movieEditDialog.show()
    updateMovie: (updatedMovie) ->
        parentModel = @options.parentModel
        index = @model.get '_index'
        response = parentModel.updateMovie index, updatedMovie
        if response is false
            #TODO :: show error in case of duplicate reject
        else
            response.fail (jqXHR, textStatus, errorThrown) ->
                if jqXHR.status is 409
                    util.showAlert 'The slot has been modified on server, and it has been updated with latest changes.', 'Out of Sync'
                else if jqXHR.status is 400
                    util.showAlert 'The updated movie fails the duplicate check, please reload the movie plan.', 'Out of Sync'
                else
                    util.handleError.apply null, arguments
        return

@MovieSearchView = Backbone.View.extend(FormView).extend
    events:
        'submit form': 'onformsubmit'
    modelFieldMapping:
        'name': '#inputName'
        'genres': '#inputGenres'
        'releaseYear': '#inputReleaseYear'
        'releaseYearOperator': '#inputReleaseYearOperator'
        'averageRating': '#inputAverageRating'
        'averageRatingOperator': '#inputAverageRatingOperator'
    elementMapping:
        'searchResultsTable': 'div.searchResults table'
        'paginationBar': 'div.pagination'
    initialize: ->
        @model.on 'reloaded', @reloadUI, @
        util.appendOptions @getField('genres'), ['Action & Adventure', 'Action Comedies', 'Action Sci-Fi & Fantasy', 'Action Thrillers', 'Adventures', 'Alien Sci-Fi', 'Animal Tales', 'Anime', 'Anime Action', 'Anime Comedies', 'Anime Dramas', 'Anime Fantasy', 'Anime Sci-Fi', 'Baseball Movies', 'Basketball Movies', 'Biographical Dramas', 'Bollywood Action & Adventure', 'Bollywood Comedies', 'Bollywood Dramas', 'Bollywood Movies', 'Boxing Movies', 'Children & Family Movies', 'Classic Action & Adventure', 'Classic Children & Family Movies', 'Classic Comedies', 'Classic Dramas', 'Classic Movies', 'Classic Musicals', 'Classic Rock', 'Classic Romantic Movies', 'Classic Sci-Fi & Fantasy',
             'Classic Thrillers', 'Classic War Movies', 'Classic Westerns', 'Comedies', 'Comic Book and Superhero Movies', 'Courtroom Dramas', 'Dark Comedies', 'Deep Sea Horror Movies', 'Disco', 'Disney', 'Disney Musicals', 'Documentaries', 'Dramas', 'Dramas based on Books', 'Dramas based on classic literature', 'Dramas based on contemporary literature', 'Dramas based on real life', 'Epics', 'Family Adventures', 'Family Comedies', 'Family Dramas', 'Family Feature Animation', 'Family Features', 'Family Sci-Fi & Fantasy', 'Fantasy Movies', 'Football Movies', 'Hindi-Language Movies', 'Historical Documentaries', 'Horror Movies', 'Indian Movies', 'Martial Arts Movies', 'Military Action & Adventure',
             'Military Documentaries', 'Military Dramas', 'Musicals', 'Mysteries', 'Political Comedies', 'Political Dramas', 'Political Thrillers', 'Psychological Thrillers', 'Romantic Comedies', 'Romantic Dramas', 'Romantic Movies', 'Satires', 'Scandinavian Movies', 'Sci-Fi & Fantasy', 'Sci-Fi Adventure', 'Sci-Fi Dramas', 'Sci-Fi Horror Movies', 'Sci-Fi Thrillers', 'Sports Comedies', 'Sports Dramas', 'Sports Movies', 'Spy Action & Adventure', 'Spy Thrillers']
        currentYear = new Date().getFullYear()
        util.appendOptions @getField('releaseYear'), [currentYear ... currentYear - 50]
        return
    onformsubmit: (e) ->
        util.startLoadingIndicator()
        promise = @model.search @getFormModel()
        promise
            .always(util.stopLoadingIndicator)
            .fail(util.handleError)
        return false
    reloadUI: ->
        model = @model        
        @getElement('searchResultsTable').html ''
        model.each @renderItem, @
        @getElement('paginationBar').shortPager
            totalPages: model.searchCriteria.totalPages,
            currentPage: model.searchCriteria.currentPage,
            callBack: (pageIndex) -> model.moveToPage(pageIndex)
        return
    renderItem: (item) ->
        view = new MovieSearchItemView model: item
        @getElement('searchResultsTable').append view.render().el
        return

@MovieSearchItemView = Backbone.View.extend(DragDropView).extend
    tagName: 'tr'
    className: 'movieResultItem row'
    render: ->
        modelObject = @model.toJSON()
        generaredHtml = util.applyTemplate 'moviceResultItemTemplate', modelObject
        @$el.html generaredHtml
        @makeDraggable {
            Id: modelObject.Id
            Name: modelObject.Name
            BoxArtUrl: modelObject.BoxArtUrl
            ShortSynopsis: modelObject.ShortSynopsis },
            'movieDragHelperTemplate',
            @$('img')
        return @