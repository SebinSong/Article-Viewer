
//-----------------------------------------------------------------------//
var pageElements = {
  all: [],
  current_left: null,
  current_right: null
};

//pageElements object setting
(function pageElementsSetting(){
  var bundle = document.querySelectorAll("div.page > figure");

  for(var i=0; i<bundle.length; i++) {
    let num = Number(bundle[i].getAttribute("name"));
    pageElements.all[num] = bundle[i];
  }

  var coverbox = document.querySelector("div.cover").getBoundingClientRect();
  console.log("coverbox size: " + "w - " + coverbox.width + " , h - " + coverbox.height);
})();

// page turning effect

(function pageTurning(){

    var remote, pages, thumb, coverPage, sb, explanation;

    //remote {} declaration
    thumb = document.querySelector("section#sb_container div.thumb");
    remote = {
      outermost: document.querySelector("div#remote_outermost"),
      container: document.querySelector("div#remote_container"),
      pre: document.querySelector("div#remote #previous"),
      next: document.querySelector("div#remote #next"),
      odd: document.querySelector("div.smallcube.odd div.wrapper"),
      even: document.querySelector("div.smallcube.even div.wrapper"),
      book: document.querySelector("div.book"),
      currentPage: 1
    };

    remote.update = function(){

      var angles = [null, "rotateY(0deg)", "rotateY(-90deg)", "rotateY(-180deg)",
                     "rotateY(-270deg)", "rotateX(-90deg)", "rotateX(90deg)"];
      var str = "translateZ(-22px) ";
      var numForPages = [null, [null, 0], [1,2], [3,4], [5,6], [7,8], [9,10], [11,null]];
      var leftp, rightp;

      this.odd.style.transform =  str + angles[this.currentPage];
      this.even.style.transform = str + angles[this.currentPage];

      leftp = pageElements.current_left = pageElements.all[numForPages[this.currentPage][0]];
      rightp = pageElements.current_right = pageElements.all[numForPages[this.currentPage][1]];

      //Both pages have to be on top of the other side on the same paper.

      if(leftp) leftp.parentNode.append(leftp);
      if(rightp) {
        rightp.parentNode.append(rightp);
        if(rightp.querySelector("div.wrapper")){

          let height = window.getComputedStyle( rightp.querySelector("div.wrapper") )
                       .getPropertyValue("height");
          height = parseInt(height,10);

          rightp.childNodes[1].scrollTop = height;
        }

      }

      thumb.style.top = "19px";
    };

    remote.rotateBook = function(currentPage){
      var rotate = [null, "rotateY(-22deg)", "rotateY(20deg)", "rotateY(15deg)",
                  "rotateY(10deg)", "rotateY(5deg)", "rotateY(0deg)"];

      this.book.style.transform =
        ( (currentPage == 1)? "translateZ(-300px) " : "translateZ(0px) " ) +
        rotate[currentPage];

    };


    pages = document.querySelectorAll("div.paper_container div.page");
    pages = (Array.prototype.slice.call(pages))
            .reverse();

    pages.unshift(null);

    remote.pre.addEventListener("click", preClick);
    remote.next.addEventListener("click", nextClick);

    coverPage = document.querySelector("div#frontcover");

    sb = {
      container: document.querySelector("section#sb_container"),
      deacti: document.querySelector("div#deactivator")
    };

    explanation = document.querySelector("div#explanation");

    remote.outermost.addEventListener("mouseenter", mhover);
    remote.outermost.addEventListener("mouseleave", mhover);
// End of the declaration Area
//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//EventHandler callbacks

    function preClick(event) {
      event.preventDefault();

      if(remote.currentPage == 1) return;

      setTimeout(removeDepth.bind(null, (remote.currentPage-1)), 300);

      pages[remote.currentPage-1].classList.remove("turned");
      if(remote.currentPage == 2) {
        sb.container.classList.add("deactivated");
        sb.deacti.style.display = "block";
        coverPage.classList.remove("turned");
        setTimeout( (function(){
          this.classList.add("set_depth");
        }).bind(explanation) ,500);
      }

      remote.currentPage--;
      remote.update();
      remote.rotateBook(remote.currentPage);

      function removeDepth(pnum) {
        pages[pnum].classList.remove("set_depth");
        if(pnum == 2) coverPage.classList.remove("set_depth");
      }
    }

    function nextClick(event) {
      event.preventDefault();

      if(remote.currentPage == 6) return;

      setTimeout(setDepth.bind(null, remote.currentPage), 300);
      // 0.6s is the current transition duration

      pages[remote.currentPage].classList.add("turned");
      if(remote.currentPage == 1) {
        coverPage.classList.add("turned");
        sb.container.classList.remove("deactivated");
        sb.deacti.style.display = "none";
        explanation.classList.remove("set_depth");

      }

      remote.currentPage++;
      remote.update();
      remote.rotateBook(remote.currentPage);

      function setDepth(pnum) {
        pages[pnum].classList.add("set_depth");
        if(pnum == 1)
          coverPage.classList.add("set_depth");
      }

    }

    function mhover (event) {

      if(event.type == "mouseenter")
        remote.container.classList.add("hovered");
      else if(event.type == "mouseleave") {
        let box = this.getBoundingClientRect();

        if(event.pageX>box.left && event.pageY < box.bottom) return;

        remote.container.classList.remove("hovered");
      }


    }

})();

/* Set-up things needed for scrollbar usage */
(function scrollBar(){

   var _scrollbar = {
     container: document.querySelector("section#sb_container"),
     track: document.querySelector("section#sb_container div.track"),
     thumb: document.querySelector("section#sb_container div.thumb"),
     up: document.querySelector("section#sb_container button.up"),
     down: document.querySelector("section#sb_container button.down"),

     thumb_h: 0, scrollLimit: 0, max_thumb_top: 0,

     firstY: 0, firstTop: 0, //used when dragging the thumb

     bytrack: { startTop: 0, targetedTop: 0, velsign: 1, requestID: 0 },
     bybutton: { distance: 5, requestID: 0 , count: 1, stilldown: false,
                 delay: 300 },
     pageControl: {scrollHeight: 0, pageHeight: 0}
   };

   _scrollbar.initialize = function(){

     var container_rect, thumb_rect, thumb_styleObj;

     container_rect = this.container.getBoundingClientRect();
     thumb_rect = this.thumb.getBoundingClientRect();
     thumb_styleObj = window.getComputedStyle(this.thumb);

     this.thumb_h = thumb_rect.height;
     this.scrollLimit = 19;
     this.max_thumb_top = Math.round(container_rect.height
                          - this.thumb_h - this.scrollLimit);

   };

   _scrollbar.init = function(event){

     var thumb_styleObj = window.getComputedStyle(this.thumb);

     this.firstTop = parseInt(thumb_styleObj.getPropertyValue("top"), 10);
     this.firstY = event.pageY;
   };

   _scrollbar.moveThumb = function(event){
     var ly, top_val;

     ly = event.pageY - this.firstY;
     top_val = Math.round(this.firstTop + ly);

     if(top_val>= (this.max_thumb_top)) top_val = this.max_thumb_top;
     else if(top_val <= this.scrollLimit) top_val = this.scrollLimit;

     this.thumb.style.top = top_val + "px";
   };

   //scrollbar.bytrack function declarations

   _scrollbar.bytrack.init = function(event){
      // Initialization for animating the thumb movement
     var _thumb, thumbbox, thumb_h, currentTop, clickY, maxTop;

     _thumb = _scrollbar.thumb;
     thumbbox = _thumb.getBoundingClientRect();
     thumb_h = Number(thumbbox.height);

     currentTop = window.getComputedStyle(_thumb).getPropertyValue("top");
     currentTop = (currentTop === "")? 0 : parseInt(currentTop, 10);
     clickY = Number(event.offsetY);

     maxTop = Math.round(_scrollbar.container.getBoundingClientRect().height
              - thumb_h - _scrollbar.scrollLimit);

     this.targetedTop = (clickY<currentTop)?
          (currentTop - thumb_h) : (currentTop + thumb_h);
     this.startTop = currentTop;

     if(this.targetedTop <= _scrollbar.scrollLimit) this.targetedTop = 19;
     else if(this.targetedTop >= maxTop) this.targetedTop = maxTop;

     this.velsign = (this.targetedTop > this.startTop)? 1 : -1;
   };

   _scrollbar.bytrack.scrollThumb = function(time){
     //why isn't this equal to _scrollbar.bytrack

      //callback for requestAnimationFrame
      var thumbTop, distance, vel, distance_tomove, ratio, toTop;

      thumbTop = window.getComputedStyle(_scrollbar.thumb).getPropertyValue("top");
      thumbTop = parseInt(thumbTop, 10);

      distance_tomove =
            Math.abs(_scrollbar.bytrack.targetedTop - _scrollbar.bytrack.startTop);
      distance = Math.abs(_scrollbar.bytrack.targetedTop - thumbTop);
      ratio = distance / distance_tomove;

      if( ratio < 0.1) vel = 1;
      else if( ratio < 0.3 ) vel = 2;
      else if( ratio < 0.5 ) vel = 4;
      else if( ratio < 0.7 ) vel = 6;
      else vel = 10;

      vel  = _scrollbar.bytrack.velsign * vel;
      toTop = thumbTop + vel;

      if(vel < 0)
        toTop = (toTop <= _scrollbar.bytrack.targetedTop)? _scrollbar.bytrack.targetedTop : toTop;
      else
      toTop = (toTop >= _scrollbar.bytrack.targetedTop)? _scrollbar.bytrack.targetedTop : toTop;

      _scrollbar.thumb.style.top = toTop + "px";

       _scrollbar.pageControl.movePages();
       // move pages along with the scrollbar position


      if(toTop == _scrollbar.bytrack.targetedTop)
        window.cancelAnimationFrame(_scrollbar.bytrack.requestID);
      else
        this.requestID = window.requestAnimationFrame(
          _scrollbar.bytrack.scrollThumb);

   };

   // _scrollbar.bybutton {} function declarations
   _scrollbar.bybutton.moveup = function(){

     var _this = _scrollbar.bybutton;
     var currentTop, wantedTop, done = false;

     currentTop = window.getComputedStyle(_scrollbar.thumb).getPropertyValue("top");
     currentTop = parseInt(currentTop, 10);


     if(_this.count!=2) wantedTop = currentTop - 2;
     else wantedTop = currentTop - 1;

     if(wantedTop <= _scrollbar.scrollLimit){
       wantedTop = _scrollbar.scrollLimit;
       done = true;
     }

     _scrollbar.thumb.style.top = wantedTop + "px";

     _scrollbar.pageControl.movePages();
     // move pages along with the scrollbar position

     if(_this.count == 2){
       done = true;
       _this.count = 1; // To its initial value
     }
     else _this.count++;

     if(done) {

       window.cancelAnimationFrame(_this.requestID);

       window.setTimeout( (function(){
         if(this.stilldown) {
           this.requestID = window.requestAnimationFrame(this.moveup);
           this.delay = 80;
         }

       }).bind(_this), _this.delay);
     }
     else
        _this.requestID = window.requestAnimationFrame(_this.moveup);

   };

   _scrollbar.bybutton.movedown = function(){

          var _this = _scrollbar.bybutton;
          var currentTop, wantedTop, done = false;

          currentTop = window.getComputedStyle(_scrollbar.thumb).getPropertyValue("top");
          currentTop = parseInt(currentTop, 10);

          if(_this.count!=2) wantedTop = currentTop + 2;
          else wantedTop = currentTop + 1;

          if(wantedTop >= _scrollbar.max_thumb_top){
            wantedTop = _scrollbar.max_thumb_top;
            done = true;
          }

          _scrollbar.thumb.style.top = wantedTop + "px";

          _scrollbar.pageControl.movePages();
          // move pages along with the scrollbar position

          if(_this.count == 2){
            done = true;
            _this.count = 1; // To its initial value
          }
          else _this.count++;

          if(done) {
            window.cancelAnimationFrame(_this.requestID);

            window.setTimeout( (function(){
              if(this.stilldown) {
                this.requestID = window.requestAnimationFrame(this.movedown);
                this.delay = 80;
              }

            }).bind(_this), _this.delay);

          }
          else
             _this.requestID = window.requestAnimationFrame(_this.movedown);

   };

   _scrollbar.pageControl.init = function(){
     var leftp, h;

     leftp = pageElements.current_left.querySelector("div.wrapper");
     h = window.getComputedStyle(leftp).getPropertyValue("height");

     this.scrollHeight = leftp.scrollHeight;
     this.pageHeight = parseInt(h, 10);

   };

   _scrollbar.pageControl.movePages = function(){

     _scrollbar.pageControl.init();

     var sb, pg, leftp, rightp, ratio, scrollTop_val;
     sb = {
       fullLength: 0, currentLength: 0, thumbtop: 0
     };
     pg = { fullLength: 0 };

     leftp = pageElements.current_left.querySelector("div.wrapper"),
     rightp = pageElements.current_right.querySelector("div.wrapper");

     sb.thumbtop = window.getComputedStyle(_scrollbar.thumb).getPropertyValue("top");
     sb.thumbtop = parseInt(sb.thumbtop,10);
     sb.fullLength = _scrollbar.max_thumb_top - _scrollbar.scrollLimit;
     sb.currentLength = sb.thumbtop - _scrollbar.scrollLimit;

     pg.fullLength = this.scrollHeight - this.pageHeight * 2;

     ratio = pg.fullLength / sb.fullLength;
     scrollTop_val = sb.currentLength * ratio;

     leftp.scrollTop = scrollTop_val;
     rightp.scrollTop = scrollTop_val + this.pageHeight;

   };

   // The end of the Delaration area
   //-------------------------------------------------------------------

   _scrollbar.initialize();
   _scrollbar.thumb.addEventListener("mousedown", mdown_thumb);
   _scrollbar.track.addEventListener("mousedown", mdown_track);
   _scrollbar.up.addEventListener("mousedown", mdown_up);
   _scrollbar.down.addEventListener("mousedown", mdown_down);
   addEventListener("mouseup", mup);

  //-------------------------------------------------------------------
   //Eventhandler callback functions

   //For Thumb
   function mdown_thumb(event) {
     event.preventDefault();

     if(event.button == 0){
       addEventListener("mousemove", mmove_thumb); // should be mounted on window
       _scrollbar.init(event);
     }
   }

   function mmove_thumb(event) {
     event.preventDefault();

      if(event.buttons == 0){
        removeEventListener("mousemove", mmove_thumb);
      }
      else {
        _scrollbar.moveThumb(event);
      }

      _scrollbar.pageControl.movePages();
   }

   //For buttons
   function mdown_up(event){
     event.preventDefault();

     _scrollbar.bybutton.stilldown = true;
     _scrollbar.bybutton.requestID =
        window.requestAnimationFrame(_scrollbar.bybutton.moveup);
   }

   function mdown_down(event){
     event.preventDefault();

     _scrollbar.bybutton.stilldown = true;
     _scrollbar.bybutton.requestID =
        window.requestAnimationFrame(_scrollbar.bybutton.movedown);

   }

   function mup(event){
     event.preventDefault();

     _scrollbar.bybutton.stilldown = false;
     _scrollbar.bybutton.delay = 300;
   }
   //For Track
   function mdown_track(event){
     _scrollbar.bytrack.init(event);
     _scrollbar.bytrack.requestID
        = window.requestAnimationFrame(_scrollbar.bytrack.scrollThumb);
   }

})();

(function ajaxRequest(){
  // pageElements.all contains all the figure tags that act as pages
  var xhttp1, xhttp2;

  xhttp1 = new XMLHttpRequest(), xhttp2 = new XMLHttpRequest();

  xhttp1.onreadystatechange = xhttp2.onreadystatechange = readystatechange;

  xhttp1.open("GET",
            "https://raw.githubusercontent.com/SebinSong/Hello-World/master/page1.html",
            true);
  xhttp1.send(null);

  xhttp2.open("GET",
            "https://raw.githubusercontent.com/SebinSong/Hello-World/master/page2.html",
            true);
  xhttp2.send(null);

  function readystatechange(){
    if(this.readyState === 4 && this.status === 200) handleData(this);
  };

  function handleData(data){
    var str = data.responseText, newpageArr, arr1, arr2;
    arr1 = [1,2,5,6,9,10], arr2 = [3,4,7,8];

    newpageArr = pageElements.all.filter(function(element, i){
      var val;
      if(this === xhttp1) val = Boolean(arr1.indexOf(i) + 1);
      else if(this ===xhttp2) val = Boolean(arr2.indexOf(i) + 1);

      return val;
    }, data);

    newpageArr.forEach(function(element, i){
      element.childNodes[1].innerHTML = str;
    });

  }

})();


(function explanationPart(){

  var navleft, navright, page;

  navleft = document.querySelector("nav#navigator > span:first-child");
  navright = document.querySelector("nav#navigator > span:last-child");
  page = {
    motivation: document.querySelector("li#motivation"),
    comment: document.querySelector("li#comment")
  };

  navleft.addEventListener("click", navClickleft);
  navright.addEventListener("click", navClickright);


  function navClickleft(event){
    event.preventDefault();

    navright.classList.remove("active");
    this.classList.add("active");

    page.motivation.classList.remove("deacti");
    page.comment.classList.add("deacti");
  }

  function navClickright(event){
    event.preventDefault();

    navleft.classList.remove("active");
    this.classList.add("active");

    page.comment.classList.remove("deacti");
    page.motivation.classList.add("deacti");
  }
})();


(function BorderMenu(){

  var trigger, nav, remote, canvas;

  trigger = document.querySelector("nav.border-menu div.trigger");
  nav = document.querySelector("nav.border-menu");
  remote = document.querySelector("div#remote_outermost");

  trigger.addEventListener("click", clicked);

  function clicked(event){

    event.preventDefault();

    if(nav.classList.contains("menu-open")) {
      nav.classList.remove("menu-open");
      remote.classList.remove("border_menu");

      //Remove Canvas Animation Here!
      deactivateCanvas();
    }
    else {
      nav.classList.add("menu-open");
      remote.classList.add("border_menu");

      //Start Canvas Animation here!
      canvas_basicSetting();
      activateCanvas();
    }

  }

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  //Canvas Execution
    canvas = {
      box: document.querySelector("canvas#stardust"),
      cw: 0, ch: 0, starArray: []
    };
    var ctx, requestID, setID;


    function canvas_basicSetting(){
      var nav_styleObj, cw, ch;
      nav_styleObj = window.getComputedStyle(nav);

      ch = parseInt(nav_styleObj.getPropertyValue("height"), 10);
      cw = parseInt(nav_styleObj.getPropertyValue("width"), 10);
      canvas.cw = canvas.box.width = cw - 130;
      canvas.ch = canvas.box.height = ch - 60;

      console.log("cw: " + cw + " , ch: " + ch);
    }


    function Stardust_Constructor() {
      var adjusted_Angle;

      this.angle = 0, this.distance = 10;
      this.width = 3, this.color = "rgb(255,255,255)", this.vel = 1;
      this.opacity = 0.3, this.vel_max = 8, this.length = 3;
      this.kill = false;

      this.angle = Math.floor( 180 * Math.random() ) *
        [-1,1][Math.floor( Math.random() * 1.99 )];
      this.angle = this.angle * (Math.PI / 180);

      if(this.angle >= 0)
        adjusted_Angle = (this.angle >= (Math.PI/2))? Math.PI - this.angle: this.angle;
      else
        adjusted_Angle = (this.angle <= (Math.PI/2)*(-1))?
          					this.angle + Math.PI : this.angle * (-1);
      this.max_distance = Math.floor(
        ((canvas.cw/2) * (1 - adjusted_Angle*2/Math.PI)) / Math.cos( adjusted_Angle )
      );

      this.distance += Math.random() * (canvas.ch*2/3);
      this.widthLimit = 1 + 4*Math.random();
      //Functions
      this.draw = drawStar;
      // Or this.draw = drawStar might be okay by itself. Let's try this out.
  }

  function activateCanvas() {
    ctx = canvas.box.getContext("2d");

    setID = window.setInterval(function(){

      for(var i=0; i<10; i++){
      	canvas.starArray.push( new Stardust_Constructor() );
      }
    }, 150);

  requestID = window.requestAnimationFrame(drawCanvas);
  }

  function deactivateCanvas() {
    window.cancelAnimationFrame(requestID);
    window.clearInterval(setID);

    canvas.box.width = canvas.box.height = 0;
    canvas.starArray = [];
  }

  function drawCanvas() {

      var newArr;

      ctx.clearRect(0,0,canvas.cw,canvas.ch);
      ctx.fillStyle = "rgba(50,50,50,1)";
      ctx.fillRect(0,0,canvas.cw,canvas.ch);

      newArr = canvas.starArray.filter(function(star){
      	star.draw();
        return !star.kill;
      });

      canvas.starArray = newArr;
      requestID = window.requestAnimationFrame(drawCanvas);
  }

  function drawStar() {

    var distanceRatio;

    ctx.save();
    ctx.lineWidth = this.width;
    ctx.strokeStyle = this.color;

    ctx.translate(canvas.cw/2, canvas.ch/2);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(this.distance,0);
    ctx.lineTo(this.distance + this.length,0);
    ctx.globalAlpha = this.opacity;
    ctx.stroke();

    ctx.restore();

    distanceRatio = this.distance / this.max_distance;
    this.distance += this.vel;

    this.vel = 1 + 11 * distanceRatio;

    this.opacity = 0.3 + 0.6 * distanceRatio;
    this.width = 3 + this.widthLimit * distanceRatio;

    if(distanceRatio > 1.15) {
      	this.kill = true;
    }
  }

})();

(function tooltip(){
  var remove = document.querySelector("div#tooltip > span#remove");

  remove.addEventListener("click", function(e){
    this.parentNode.classList.add("remove");
  });

})();
