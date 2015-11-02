//Declaring global variables
var map;
var marker;
var infowindow;

//Creating a list of golfclubs to populate the map
var golfclubModel = [
    {
        name: "Presido Golf Course",
        lat: 37.7905727,
        lng: -122.462076,
        category: "Public",
        price: 120,
        tag: "presidiogolf"
    },{
        name: "Lincoln Park Golf Course",
        lat: 37.7838297,
        lng: -122.5142605,
        category: "Public",
        price: 20,
        tag: "lincolnparkgolf"
    },{
        name: "Golden Gate Park Golf Course",
        lat: 37.7744001,
        lng: -122.5133164,
        category: "Private",
        price: 35,
        tag: "golfdengategolf"
    },{
        name: "Flemming - 9 hole course",
        lat: 37.7199134,
        lng: -122.4862336,
        category: "Public",
        price: 22,
        tag: "flemminggolf"
    },{
        name: "TPC Harding Park",
        lat: 37.7251079,
        lng: -122.4956327,
        category: "Public",
        price: 165,
        tag: "tpcpark"
    },{
        name: "San Francisco Golf Club",
        lat: 37.7104663,
        lng: -122.4786383,
        category: "Public",
        price: 45,
        tag: "sanfranciscogolf"
    },{
        name: "The Olympic Club",
        lat: 37.709339,
        lng: -122.497006,
        category: "Private",
        price: 270,
        tag: "theolympicclubgolf"
    }
];

//Creates a golf club object
var Golfclub = function(data) {
    this.name = ko.observable(data.name);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.price = ko.observable(data.price);
    this.category = ko.observable(data.category);
    this.tag = ko.observable(data.tag);
    this.marker = ko.observable();
    this.isVisible = ko.observable(false);
    this.photo = ko.observable();
};

//Initialize the Google map and set map options (center and map type)
function initMap() {

    //Options for the Google map
    var mapOptions = {
        center: new google.maps.LatLng(37.7576792,-122.5078118),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    infowindow = new google.maps.InfoWindow();

    ko.applyBindings(new ViewModel());
}

function ViewModel() {

    var self = this;

    //Declare observable for the filter and for the list of golf clubs
    self.golfclubList = ko.observableArray([]);
    self.filter = ko.observable('');

    //Populate the golf club list with golf club objects
    golfclubModel.forEach(function(golfclubItem){
        self.golfclubList.push( new Golfclub(golfclubItem) );
    });

    //Creating a marker for each of the items in the golfclub list
    self.golfclubList().forEach(function(golfclubItem){
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(parseFloat(golfclubItem.lat()), parseFloat(golfclubItem.lng())),
            map: map,
            anitmation: google.maps.Animation.DROP,
            title: golfclubItem.name()
        });

        //Assigning the marker as an attribute to the golf club item object
        golfclubItem.marker = marker;

        //Assigning visible / invisible as an attribute of the golf club object
        //Source: http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
        golfclubItem.isVisible.subscribe(function(currentState) {
            if(currentState) {
                golfclubItem.marker.setMap(map);
            } else {
                golfclubItem.marker.setMap(null);
            }
        });
        golfclubItem.isVisible(true);

        //Add a listener to a click on a marker to trigger the bounce effect
        //and to open the infowindow
        google.maps.event.addListener(golfclubItem.marker, 'click', function(){
            golfclubItem.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){ 
                golfclubItem.marker.setAnimation(null); 
            }, 750);
            // Declare InfoWindow variables and create the content
            var content_string = 
                '<div class="thumbnail"><img src="' +
                golfclubItem.photo() + '" alt="' + golfclubItem.name() + 
                '"><div class="caption"><p>' + golfclubItem.name() + 
                '<h3><span class="label label-success">#' +
                golfclubItem.tag() + '</span></h3></p></div></div>';
             
             infowindow.setContent(content_string);
             infowindow.open(map, golfclubItem.marker);
        });
        

        //Client ID registered with Instagram API
        var accessToken = '037558c22aa9497bb49fe57fe097951e';

        //Calling the instagram API to get images for the infowindows based on the tag
        $.ajax({
            url: 'https://api.instagram.com/v1/tags/' + golfclubItem.tag() + '/media/recent',
            dataType: 'jsonp',
            type: 'GET',
            data: {client_id: accessToken},
            success: function(data){
                //Checking that the array returned is not empty, if so assign default image
                if(data.data.length === 0){
                    golfclubItem.photo("https://scontent.cdninstagram.com/hphotos-xaf1/t51.2885-15/s150x150/e35/c135.0.810.810/12071097_474914042679788_769310138_n.jpg");
                    golfclubItem.tag("no-pic-available-using-default");
                } else {
                    golfclubItem.photo(data.data[0].images.thumbnail.url);
                }
            },
            error: function(data){
                //Console print out for error messages
                console.log(data);
            }
        });
    });
    
    //Added a listener to track clicks on the map to close the info windows
    google.maps.event.addListener(map, "click", function(){
        infowindow.close();
    });

    //Triggers a click on the marker depending on the item in the listview
    self.openInfoWindowFromListView = function(golfclubItem){
        google.maps.event.trigger(golfclubItem.marker, 'click');
    };

    //Filter function which takes the input from the filter text field and 
    //compares it to each name in the list of golf clubs. If the filter 
    //string contains a match it will return true and set the attribute to 
    //visible on the golf club object.
    //Source 1: http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
    //Source 2: http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
    self.filterGolfclubs = ko.dependentObservable(function () {
        var filter = self.filter().toLowerCase();
        return ko.utils.arrayFilter(self.golfclubList(), function(golfclub){
            var doesMatch = golfclub.marker.title.toLowerCase().indexOf(filter) >= 0;
            golfclub.isVisible(doesMatch);
            return doesMatch;
        });
    });
}