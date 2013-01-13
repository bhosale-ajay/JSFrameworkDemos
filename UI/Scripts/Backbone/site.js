(function (main) {
    var util = {};
    var alertBox = null;
    util.templateLibrary = {};
    util.loadTemplate = function (templateName) {
        var source = $("#" + templateName).html();
        util.templateLibrary[templateName] = Handlebars.compile(source);
    };
    util.applyTemplate = function (templateName, model) {
        if (!util.templateLibrary[templateName]) {
            util.loadTemplate(templateName);
        }
        return util.templateLibrary[templateName](model);
    };
    util.showAlert = function (message, header) {
        header = header ? header : 'Error Occurred';
        if (!alertBox) {
            alertBox = $('<div class="modal"><div class="modal-header">' +
                         '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                         '<h3>Error Occurred</h3></div><div class="modal-body"></div></div>');
            $(window.body).append(alertBox);
        }
        alertBox.find('div.modal-body').text(message);
        alertBox.find('h3').text(header);
        alertBox.modal();
    };
    util.handleError = function (jqXHR, textStatus, errorThrown) {
        var message = jqXHR.responseText;
        if (!message) {
            if (textStatus == 'timeout') {
                message = "The request timed out.";
            }
            else {
                messate = "Some unknown error occurred.";
            }
        }
        window.util.showAlert(message);
    }
    util.startLoadingIndicator = function () {
    };
    util.stopLoadingIndicator = function () {
    };
    util.appendOptions = function (element, options) {
        for (var index in options) {
            var value, text, option;
            option = options[index];
            if (typeof (option) == "object") {
                value = option.value;
                text = option.text;
            }
            else {
                value = text = option;
            }
            element.append($('<option>', { value: value, text: text }));
        }
    };
    main.util = util;
})(window);
(function ($) {
    $.fn.shortPager = function (options) {
        return this.each(function () {
            if (!options) {
                options = {};
            }
            var $this = $(this);
            var visiblePageLinks = options.visiblePageLinks ? options.visiblePageLinks : 4;
            var totalPages = options.totalPages;
            var currentPage = options.currentPage;
            var startsFrom = (Math.ceil(currentPage / visiblePageLinks) - 1) * visiblePageLinks + 1;
            var callBack;
            if (options.callBack) {
                callBack = options.callBack;
            }

            var linkClicked = function () {
                var $link = $(this);
                var activePage = -1;
                if ($link.hasClass('pager-page')) {
                    activePage = $link.text();
                }
                else if ($link.hasClass('pager-prev') && 1 < startsFrom) {
                    activePage = startsFrom - 1;
                }
                else if ($link.hasClass('pager-next') && startsFrom + visiblePageLinks <= totalPages) {
                    activePage = startsFrom + visiblePageLinks; ;
                }
                if (activePage != -1 && callBack) {
                    callBack(activePage);
                }
                return false;
            };

            var rebuildUI = function () {
                var ul = $this.find('ul:first');
                ul.find('li a').unbind('click', linkClicked);
                if (ul.length == 0) {
                    ul = $('<ul>');
                    $this.append(ul);
                }
                else {
                    ul.empty();
                }

                if (totalPages == 0) {
                    return;
                }

                var li = $('<li>');
                ul.append(li);
                var prevLink = $('<a>', { href: '#', class: 'pager-prev', text: '<<' })
                li.append(prevLink);

                for (var pageCounter = startsFrom;
                        pageCounter <= totalPages
                        &&
                        pageCounter < startsFrom + visiblePageLinks;
                        pageCounter++) {
                    li = $('<li>');
                    ul.append(li);
                    link = $('<a>', { href: '#', class: 'pager-page', text: pageCounter });
                    li.append(link);
                    link.parent().toggleClass('active', currentPage == pageCounter);
                }

                li = $('<li>');
                ul.append(li);
                var nextLink = $('<a>', { href: '#', class: 'pager-next', text: '>>' });
                li.append(nextLink);
                prevLink.parent().toggleClass('disabled', startsFrom == 1);
                nextLink.parent().toggleClass('disabled', totalPages < startsFrom + visiblePageLinks);
                ul.find('li a').click(linkClicked);
            };
            rebuildUI();
        });
    };
})(jQuery);