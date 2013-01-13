(function (root) {
    root.DragDropView = {
        makeDraggable: function (model, template, element, onStart, onStop) {
            var that = this;
            element = element ? element : this.$el;
            var html = window.util.applyTemplate(template, model);
            element
                .data("model", model)
                .draggable({
                    appendTo: 'body',
                    revert: 'invalid',
                    helper: function () {
                        return $(html);
                    },
                    start: function () {
                        if (onStart) {
                            onStart.apply(that);
                        }
                    },
                    stop: function () {
                        if (onStop) {
                            onStop.apply(that);
                        }
                    },
                    cursorAt: { cursor: 'move', top: 5, left: 5 }
                });
        },
        makeDroppable: function (elements, onDrop) {
            var that = this;
            elements.each(function (index, e) {
                var element = $(e);
                element.droppable({
                    tolerance: 'pointer',
                    hoverClass: 'ui-state-highlight',
                    drop: function (event, ui) {
                        if (onDrop) {
                            onDrop.call(that, element, $(ui.draggable).data('model'));
                        }
                    }
                });
            });
        }
    };
    root.ViewWithFields = {
        elementMapping: {},
        fieldMapping: {},
        fields: {},
        elements: {},
        fieldObject: function () {
            var result = {};
            for (var eachField in this.fields) {
                result[eachField] = this.fields[eachField].val();
            }
            return result;
        },
        loadFields: function () {
            for (var eachFieldMapping in this.fieldMapping) {
                this.fields[eachFieldMapping] = this.$(this.fieldMapping[eachFieldMapping]);
            }
        },
        loadElements: function () {
            for (var eachElementMapping in this.elementMapping) {
                this.elements[eachElementMapping] = this.$(this.elementMapping[eachElementMapping]);
            }
        },
        initialize: function () {
            this.loadFields();
            this.loadElements();
        }
    };
})(window);