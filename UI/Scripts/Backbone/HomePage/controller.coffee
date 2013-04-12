jQuery ->
    moviesModel = new SearchableCollection
    moviesModel.url = '/api/Movies'
    movieSearchView = new MovieSearchView
        el: $('div.searchLeftBar')
        model: moviesModel
    
    moviePlanView = new MoviePlanView
        el: $('div.moviePlan')
        model: new MoviePlan
    return
