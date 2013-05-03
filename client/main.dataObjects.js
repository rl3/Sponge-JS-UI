
var getDataObjects= getCachedData('dataObjects', 1000000);
Template.dataObjects.dataObjects= function() {
    console.log(getDataObjects.toString());
    var help= getDataObjects();
    console.log("help", help);
    return help;
}
