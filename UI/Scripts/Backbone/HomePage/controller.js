$(function () {
    var moviesModel = new SearchableCollection;
    moviesModel.url = '/api/Movies';
    var movieSearchView = new MovieSearchView({
        el: $('div.searchLeftBar'),
        model: moviesModel
    });
    var moviePlanView = new MoviePlanView({
        el: $('div.moviePlan'),
        model: new MoviePlan
    });
});
