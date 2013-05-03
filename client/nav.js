
var uniqueId= 0;

Nav= function() {
    this.tabs= [];
};

Nav.prototype.add= function(title, content, param) {

    if (typeof content !== 'function') {
        var contentText= content;
        content= function() {
            return String(contentText);
        }
    }

    var newElem= {
        title: title,
        content: "EMPTY",
        id: 'navElement_' + uniqueId++,
    };

    this.tabs.push(newElem);

    $(document).on('show', 'a[href=".' + newElem.id + '"]', function(e) {
        $('.' + newElem.id).html(content(param));
    })
};

Nav.prototype.addTemplate= function(title, templateName) {
    this.add(title, function() {
        return Template[templateName]();
    });
};
