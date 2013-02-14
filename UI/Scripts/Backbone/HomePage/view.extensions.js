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
    root.FormView = {
        getFormModel: function () {
            var result = {},
                currentParent,
                propertyChain,
                property,
                eachProperty,
                propertyDeapthCounter;
            if (this.modelFieldMapping) {
                for (eachProperty in this.modelFieldMapping) {
                    propertyChain = eachProperty.split('.');
                    currentParent = result;
                    for (propertyDeapthCounter = 0; propertyDeapthCounter < propertyChain.length - 1; propertyDeapthCounter += 1) {
                        property = propertyChain[propertyDeapthCounter];
                        if (!currentParent[property]) {
                            currentParent[property] = {};
                        }
                        currentParent = currentParent[property];
                    }
                    property = propertyChain[propertyChain.length - 1];
                    currentParent[property] = this.getField(eachProperty).val();
                }
            }
            return result;
        },
        getField: function (property) {
            var result;
            if (!this.fields) {
                this.fields = {};
            }
            var result = this.fields[property];
            if (result) {
                return result;
            }
            if (this.modelFieldMapping && this.modelFieldMapping[property]) {
                var fieldIdentifier = this.modelFieldMapping[property];
                result = this.fields[property] = this.$(fieldIdentifier);
            }
            return result;
        },
        getElement: function (identifier) {
            var result;
            if (!this.elements) {
                this.elements = {};
            }
            var result = this.elements[identifier];
            if (result) {
                return result;
            }
            if (this.elementMapping && this.elementMapping[identifier]) {
                var elementIdentifier = this.elementMapping[identifier];
                result = this.elements[identifier] = this.$(elementIdentifier);
            }
            return result;
        }
    };
    _.extend(Backbone.Validation.callbacks, {
        valid: function (view, attr, selector) {
            var control = view.getField(attr);
            if (!control) {
                return;
            }

            var group = control.parents(".control-group");
            group.removeClass("error");

            if (control.data("error-style") === "inline") {
                group.find(".help-inline.error-message").remove();
            }
            else {
                group.find(".help-block.error-message").remove();
            }
        },
        invalid: function (view, attr, error, selector) {
            var control = view.getField(attr);
            if (!control) {
                return;
            }

            var group = control.parents(".control-group");
            group.addClass("error");

            if (control.data("error-style") === "inline") {
                if (group.find(".help-inline").length === 0) {
                    group.find(".controls").append("<span class=\"help-inline error-message\"></span>");
                }
                var target = group.find(".help-inline");
                target.text(error);
            }
            else {
                if (group.find(".help-block").length === 0) {
                    group.find(".controls").append("<p class=\"help-block error-message\"></p>");
                }
                var target = group.find(".help-block");
                target.text(error);
            }
        }
    });
})(window);