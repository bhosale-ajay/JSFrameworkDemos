var MoviePlanView = Backbone.View.extend(window.DragDropView).extend({
    initialize: function () {
        this.model.on('reloaded', this.renderMoviePlan, this);
        this.loadMoviePlanAndHandleResponse();
        this.makeRowHeadersDroppbale();
    },
    loadMoviePlanAndHandleResponse: function () {
        window.util.startLoadingIndicator();
        //disable all interactions
        var promise = this.model.loadFromServer({ 'startDate': window.CURRENT_DATE });
        promise
            .always(window.util.stopLoadingIndicator)
            .fail(window.util.handleError)
            .done(function () {
                //enable all interactions
            });
    },
    renderMoviePlan: function () {
        var slots = this.model.get('Slots');
        for (var idx = 0; idx < slots.length; idx++) {
            var slot = slots[idx];
            var slotView = new SlotView({ model: slot,
                el: this.$('#' + slot.get('TimeSlot') + '_' + slot.get('Day'))
            });
            slotView.render();
        }
    },
    makeRowHeadersDroppbale: function () {
        this.makeDroppable(this.$('td.showtime'), function (rowHeader, movie) {
            var timeslot = rowHeader.data('timeslot');
            var response = this.model.attachMoiveToSlots(timeslot, movie);
        });
    }
});

var MovieEditView = Backbone.View.extend({
    initialize: function () {
        var modelObject = this.model.toJSON();
        this.$el.html(window.util.applyTemplate('moviePlanSlot', modelObject));
    }
});

var SlotView = Backbone.View.extend(window.DragDropView).extend({
    initialize: function () {
        this.model.on('change', this.render, this);
        this.setDropOptions();
    },
    render: function () {
        var modelObject = this.model.toJSON();
        this.$el.html(window.util.applyTemplate('moviePlanSlot', modelObject));
        if (modelObject.Movie) {
            var movieImage = this.$('img');
            this.makeDraggable(modelObject.Movie, 'movieDragHelperTemplate', movieImage);
            movieImage.on('click', this.onMovieClick);
        }
        return this;
    },
    onMovieClick: function () {
        
    },
    setDropOptions: function () {
        var model = this.model;
        this.makeDroppable(this.$el, function (cell, droppedMovie) {
            var parentModel = model.get('_parent');
            var index = model.get('_index');
            var response = parentModel.updateMovie(index, droppedMovie);
            if (response === false) {
                //TODO :: show error in case of duplicate reject
            }
            else {
                response.fail(function (jqXHR, textStatus, errorThrown) {
                    if (jqXHR.status == 409) {
                        util.showAlert('The slot has been modified on server, and it has been updated with latest changes.', 'Out of Sync');
                    }
                    else if (jqXHR.status == 400) {
                        util.showAlert('The updated movie fails the duplicate check, please reload the movie plan.', 'Out of Sync');
                    }
                    else {
                        util.handleError.apply(null, arguments);
                    }
                });
            }
        });
    }
});

var MovieSearchView = Backbone.View.extend(window.ViewWithFields).extend({
    events: {
        'submit form': 'onformsubmit'
    },
    fieldMapping: {
        'name': '#inputName',
        'genres': '#inputGenres',
        'releaseYear': '#inputReleaseYear',
        'releaseYearOperator': '#inputReleaseYearOperator',
        'averageRating': '#inputAverageRating',
        'averageRatingOperator': '#inputAverageRatingOperator'
    },
    elementMapping: {
        'searchResultsTable': 'div.searchResults table',
        'paginationBar': 'div.pagination'
    },
    initialize: function () {
        this.loadFields();
        this.loadElements();

        this.model.on('reloaded', this.reloadUI, this);

        window.util.appendOptions(this.fields['genres'],
                            ['Action & Adventure', 'Action Comedies', 'Action Sci-Fi & Fantasy', 'Action Thrillers', 'Adventures', 'Alien Sci-Fi', 'Animal Tales', 'Anime', 'Anime Action', 'Anime Comedies', 'Anime Dramas', 'Anime Fantasy', 'Anime Sci-Fi', 'Baseball Movies', 'Basketball Movies', 'Biographical Dramas', 'Bollywood Action & Adventure', 'Bollywood Comedies', 'Bollywood Dramas', 'Bollywood Movies', 'Boxing Movies', 'Children & Family Movies', 'Classic Action & Adventure', 'Classic Children & Family Movies', 'Classic Comedies', 'Classic Dramas', 'Classic Movies', 'Classic Musicals', 'Classic Rock', 'Classic Romantic Movies', 'Classic Sci-Fi & Fantasy',
                             'Classic Thrillers', 'Classic War Movies', 'Classic Westerns', 'Comedies', 'Comic Book and Superhero Movies', 'Courtroom Dramas', 'Dark Comedies', 'Deep Sea Horror Movies', 'Disco', 'Disney', 'Disney Musicals', 'Documentaries', 'Dramas', 'Dramas based on Books', 'Dramas based on classic literature', 'Dramas based on contemporary literature', 'Dramas based on real life', 'Epics', 'Family Adventures', 'Family Comedies', 'Family Dramas', 'Family Feature Animation', 'Family Features', 'Family Sci-Fi & Fantasy', 'Fantasy Movies', 'Football Movies', 'Hindi-Language Movies', 'Historical Documentaries', 'Horror Movies', 'Indian Movies', 'Martial Arts Movies', 'Military Action & Adventure',
                             'Military Documentaries', 'Military Dramas', 'Musicals', 'Mysteries', 'Political Comedies', 'Political Dramas', 'Political Thrillers', 'Psychological Thrillers', 'Romantic Comedies', 'Romantic Dramas', 'Romantic Movies', 'Satires', 'Scandinavian Movies', 'Sci-Fi & Fantasy', 'Sci-Fi Adventure', 'Sci-Fi Dramas', 'Sci-Fi Horror Movies', 'Sci-Fi Thrillers', 'Sports Comedies', 'Sports Dramas', 'Sports Movies', 'Spy Action & Adventure', 'Spy Thrillers']);

        var currentYear = new Date().getFullYear();
        var years = [];
        for (var eachYear = currentYear; eachYear > currentYear - 50; eachYear--) {
            years.push(eachYear);
        }
        window.util.appendOptions(this.fields['releaseYear'], years);
    },
    onformsubmit: function (e) {
        window.util.startLoadingIndicator();
        var promise = this.model.search(this.fieldObject());
        promise
            .always(window.util.stopLoadingIndicator)
            .fail(window.util.handleError);
        return false;
    },
    reloadUI: function () {
        this.elements['searchResultsTable'].html('');
        this.$('img').popover('destroy');
        var model = this.model;
        model.each(this.renderItem, this);
        this.$('img').popover({ placement: 'left', trigger: 'manual' });
        this.elements['paginationBar'].shortPager({
            totalPages: model.searchCriteria.totalPages,
            currentPage: model.searchCriteria.currentPage,
            callBack: function (pageIndex) {
                model.moveToPage(pageIndex);
            }
        });
    },
    renderItem: function (item) {
        var view = new MovieSearchItemView({ model: item });
        this.elements['searchResultsTable'].append(view.render().el);
    }
});

var MovieSearchItemView = Backbone.View.extend(window.DragDropView).extend({
    tagName: 'tr',
    className: 'movieResultItem row',
    render: function () {
        var modelObject = this.model.toJSON();
        this.$el.html(window.util.applyTemplate('moviceResultItemTemplate', modelObject));
        this.makeDraggable(
            {
                Id: modelObject.Id,
                Name: modelObject.Name,
                BoxArtUrl: modelObject.BoxArtUrl,
                ShortSynopsis: modelObject.ShortSynopsis
            },
            'movieDragHelperTemplate',
            this.$('img'));
        return this;
    }
});