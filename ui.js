pc.script.create('ui', function (context) {
    var state = 0; //0 = menu, 1 = game, 2 = instructions, 3 = gameover
    
    var title = "Charitable Donation", subTitle = "You only have one...coin", scale = 1,
    mainmenu = [{text:"Play", colour: "black"},{text: "Instructions", colour: "black"}], back = [{text:"Back", colour: "black"}],
    instructions = ["", "In this game you only have one coin", "You must save as many people as possible", "", "To the right is a charity coin cascade", "But it seems to be magical,", "Or broken, or something",
    "","Depending on where the coin lands", "You might save people, or get more coins", "", "Keep going until you run out of coins", "And save as many people as possible"],
    baseColours = ["Yellow", "Black", "Orange", "Purple"], topColours = [{text:"White"}, {text:"Blue"}, {text:"Green"}, {text:"Red"}], prizes = [{text:"One coin", amount:1, coins:true}, {text:"Two coins", amount:2, coins:true}, 
    {text:"Three coins", amount:3, coins:true},{text:"One person", amount:1, coins:false}, {text:"Two people", amount:2, coins:false}, {text:"Three people", amount:3, coins:false}, {text:"Five people", amount:5, coins:false}],
    currentPrizes = [0,3,5,2], coins = 1, people = 0, activeDrop = 0, leftCenter = 250, dropChanges = [{text: "<", colour:"black"}, {text:">", colour:"black"}], drop = [{text:"DROP THE BALL!", colour: "black"}], 
    ballBoundaries = [{zMin:28, zMax: 47},{zMin:3, zMax:22},{zMin:-22, zMax:-3},{zMin:-47, zMax:-28}], ballDefault = [0,101,0], dropping = false, ball, machine, lastPlink;
    
    // Creates a new Ui instance
    var Ui = function (entity) {
        this.entity = entity;
    };
    
    function contains(event,obj){
        if(event.x > obj.x && event.y > obj.y && event.x < obj.xMax && event.y < obj.yMax)
        {
            return true;
        }
        else return false;
    }

    Ui.prototype = {
        initialize: function () {            
            this.mainCanvas = $('#application-canvas');
            
            //create canvas overlay
            $('#application-container').append('<canvas id="hud_overlay" width="'+ this.mainCanvas.width() +'" height="'+ this.mainCanvas.height() +
            '" style="z-index: 1; top: 0; left: 0; position: absolute;"></canvas>');
            canvas = document.getElementById("hud_overlay");
            ctx = canvas.getContext("2d");
            
            //Add event listener for clicks and mouse moves
            canvas.addEventListener("mousedown", this.canvasClick); 
            canvas.addEventListener("mousemove", this.canvasMove);
            
            $(window).resize(function(event){
                context.systems.script.broadcast('ui', 'drawLeft');
            });
            
            mainmenu[0].x = leftCenter;
            mainmenu[1].x = leftCenter;
            back[0].x = leftCenter;
            
            ball = context.root.findByName('coin');
            machine = context.root.findByName('machine');
            ball.collision.on('contact',this.reportCollision, this);
            
            this.drawLeft();
        },

        update: function (dt) {
        },
        
        reportCollision: function(result){
            if(dropping)
            {
                if(result.other.getName() === "aPad" || result.other.getName() === "bPad" || result.other.getName() === "cPad" || result.other.getName() === "dPad")
                {
                    var prize = 0; 
                    
                    if(result.other.getName() === "bPad") prize = 1;
                    
                    if(result.other.getName() === "cPad") prize = 2;
                    
                    if(result.other.getName() === "dPad") prize = 3;
                                        
                    dropping = false;
                    this.claimPrize(prize);
                }
            }
            
            if(result.other.getName() === "pin")
            {
                if(result.other._guid !== lastPlink)
                {
                    machine.audiosource.play('plink');
                    lastPlink = result.other._guid;
                }
            }
        },
        
        claimPrize: function(prize){
            if(prizes[currentPrizes[prize]].coins)
            {
                coins += prizes[currentPrizes[prize]].amount;
            }
            else
            {
                people += prizes[currentPrizes[prize]].amount;
            }
                        
            this.randomizePrizes();
            this.drawLeft();
            
            if(coins < 1)
            {
                this.switchState(3);
            }
            
        },
        
        randomizePrizes: function(){
            currentPrizes[0] = Math.floor(Math.random()*5)+1;
            currentPrizes[1] = 0;
            currentPrizes[2] = Math.floor(Math.random()*4)+2;
            currentPrizes[3] = Math.floor(Math.random()*2);
        },
        
        credits: function(){
            ctx.font = "12px Moire";
            ctx.fillStyle = 'black';
            ctx.textAlign = "center";
            
            ctx.fillText("by @LizzipFish", 50, canvas.height - 10);
        },
        
        cleanCanvas: function(options){
            ctx.clearRect(options.x || 0, options.y || 0, options.xMax || canvas.width, options.yMax || canvas.height);
        },
        
        canvasClick: function(e){
            if(state === 0) //Menu
            {
                if(contains({x: event.layerX, y:event.layerY},{x:mainmenu[0].x - (ctx.measureText(mainmenu[0].text).width/2), 
                y:mainmenu[0].y - 32, xMax: mainmenu[0].x + (ctx.measureText(mainmenu[0].text).width/2), yMax: mainmenu[0].y + 10}))
                {
                    context.systems.script.broadcast('ui', 'reset');
                    context.systems.script.broadcast('ui', 'switchState', 1);
                }
                else if(contains({x: event.layerX, y:event.layerY},{x:mainmenu[1].x - (ctx.measureText(mainmenu[1].text).width/2), 
                y:mainmenu[1].y - 32, xMax: mainmenu[1].x + (ctx.measureText(mainmenu[1].text).width/2), yMax: mainmenu[1].y + 10}))
                {
                    context.systems.script.broadcast('ui', 'switchState', 2);
                }
            }
            else if(state === 1)
            {
                if(contains({x: event.layerX, y:event.layerY},{x:back[0].x - (ctx.measureText(back[0].text).width/2), 
                y:back[0].y - 32, xMax: back[0].x + (ctx.measureText(back[0].text).width/2), yMax: back[0].y + 10}))
                {
                    context.systems.script.broadcast('ui', 'switchState', 0);
                }
                
                if(contains({x: event.layerX, y:event.layerY},{x:dropChanges[0].x - (ctx.measureText(dropChanges[0].text).width/2), 
                y:dropChanges[0].y - 32, xMax: dropChanges[0].x + (ctx.measureText(dropChanges[0].text).width/2), yMax: dropChanges[0].y + 10}))
                {
                    if(activeDrop > 0) activeDrop--;
                    else activeDrop = 3;
                    context.systems.script.broadcast('ui', 'drawLeft');
                }
                
                if(contains({x: event.layerX, y:event.layerY},{x:dropChanges[1].x - (ctx.measureText(dropChanges[1].text).width/2), 
                y:dropChanges[1].y - 32, xMax: dropChanges[1].x + (ctx.measureText(dropChanges[1].text).width/2), yMax: dropChanges[1].y + 10}))
                {
                    if(activeDrop < 3) activeDrop++;
                    else activeDrop = 0;
                    context.systems.script.broadcast('ui', 'drawLeft');
                }
                
                if(contains({x: event.layerX, y:event.layerY},{x:drop[0].x - (ctx.measureText(drop[0].text).width/2), 
                y:drop[0].y - 32, xMax: drop[0].x + (ctx.measureText(drop[0].text).width/2), yMax: drop[0].y + 10}))
                {
                    context.systems.script.broadcast('ui', 'doDrop');
                }
            }
            else if(state === 2)
            {
                if(contains({x: event.layerX, y:event.layerY},{x:back[0].x - (ctx.measureText(back[0].text).width/2), 
                y:back[0].y - 32, xMax: back[0].x + (ctx.measureText(back[0].text).width/2), yMax: back[0].y + 10}))
                {
                    context.systems.script.broadcast('ui', 'switchState', 0);
                }
            }
            else if(state === 3)
            {
                if(contains({x: event.layerX, y:event.layerY},{x:back[0].x - (ctx.measureText(back[0].text).width/2), 
                y:back[0].y - 32, xMax: back[0].x + (ctx.measureText(back[0].text).width/2), yMax: back[0].y + 10}))
                {
                    context.systems.script.broadcast('ui', 'switchState', 0);
                }
            }
        },
        
        canvasMove: function(event){
            if(state === 0)
            {
                $.each(mainmenu, function( index, value ) {                    
                    if(contains({x: event.layerX, y:event.layerY},{x:value.x - (ctx.measureText(value.text).width/2), 
                    y:value.y - 32, xMax: value.x + (ctx.measureText(value.text).width/2), yMax: value.y + 10}))
                    {
                        if(value.colour === "black")
                        {
                            value.colour = "grey";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                    else
                    {
                        if(value.colour !== "black")
                        {
                            value.colour = "black";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                });
            }
            else if(state === 1)
            {
                $.each(back, function( index, value ) {                    
                    if(contains({x: event.layerX, y:event.layerY},{x:value.x - (ctx.measureText(value.text).width/2), 
                    y:value.y - 32, xMax: value.x + (ctx.measureText(value.text).width/2), yMax: value.y + 10}))
                    {
                        if(value.colour === "black")
                        {
                            value.colour = "grey";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                    else
                    {
                        if(value.colour !== "black")
                        {
                            value.colour = "black";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                });
                
                $.each(dropChanges, function( index, value ) {                    
                    if(contains({x: event.layerX, y:event.layerY},{x:value.x - (ctx.measureText(value.text).width/2), 
                    y:value.y - 32, xMax: value.x + (ctx.measureText(value.text).width/2), yMax: value.y + 10}))
                    {
                        if(value.colour === "black")
                        {
                            value.colour = "grey";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                    else
                    {
                        if(value.colour !== "black")
                        {
                            value.colour = "black";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                });
                
                $.each(drop, function( index, value ) {                    
                    if(contains({x: event.layerX, y:event.layerY},{x:value.x - (ctx.measureText(value.text).width/2), 
                    y:value.y - 32, xMax: value.x + (ctx.measureText(value.text).width/2), yMax: value.y + 10}))
                    {
                        if(value.colour === "black")
                        {
                            value.colour = "grey";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                    else
                    {
                        if(value.colour !== "black")
                        {
                            value.colour = "black";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                });
            }
            else if(state === 2)
            {
                $.each(back, function( index, value ) {                    
                    if(contains({x: event.layerX, y:event.layerY},{x:value.x - (ctx.measureText(value.text).width/2), 
                    y:value.y - 32, xMax: value.x + (ctx.measureText(value.text).width/2), yMax: value.y + 10}))
                    {
                        if(value.colour === "black")
                        {
                            value.colour = "grey";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                    else
                    {
                        if(value.colour !== "black")
                        {
                            value.colour = "black";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                });
            }
            else if(state === 3)
            {
                $.each(back, function( index, value ) {                    
                    if(contains({x: event.layerX, y:event.layerY},{x:value.x - (ctx.measureText(value.text).width/2), 
                    y:value.y - 32, xMax: value.x + (ctx.measureText(value.text).width/2), yMax: value.y + 10}))
                    {
                        if(value.colour === "black")
                        {
                            value.colour = "grey";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                    else
                    {
                        if(value.colour !== "black")
                        {
                            value.colour = "black";
                            context.systems.script.broadcast('ui', 'drawLeft');
                        }
                    }
                });
            }
        },
        
        switchState: function(newState){
            state = newState;
            this.drawLeft();
        },
        
        drawLeft: function(){
            this.cleanCanvas({xMax:canvas.width/2});
            
            mainmenu[0].y = canvas.height/4;
            mainmenu[1].y = canvas.height/3;
            back[0].y = canvas.height - 50;
            
            var screenWidth = $('#application-canvas').width();
            var screenHeight = $('#application-canvas').height();
            ctx.canvas.width  = screenWidth;
            ctx.canvas.height = screenHeight;
            
            if(canvas.width < 750) scale = 0.75;
            if(canvas.width < 500) scale = 0.5;
            
            this.drawTitle();
            
            //draw content
            if(state === 0)
            {
                this.drawIntroMenu();
            }
            else if(state === 1)
            {
                this.drawGame();
            }
            else if(state === 2)
            {
                this.drawInstructions();
            }
            else if(state === 3)
            {
                this.drawGameOver();
            }
            
            this.credits();
        },
        
        drawTitle: function(){
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            var fontsize = Math.round(36 * scale);
            ctx.font = "" + fontsize + "px Moire";
            ctx.fillText(title, leftCenter, canvas.height/10);
            fontsize = Math.round(24 * scale);
            ctx.font = "" + fontsize + "px Moire";
            ctx.fillText(subTitle, leftCenter, canvas.height/7);
        },
        
        drawIntroMenu: function(){
            var fontsize = Math.round(32 * scale);
            ctx.font = "" + fontsize + "px Moire";
            ctx.textAlign = "center";
            
            $.each(mainmenu, function( index, value ) {
                ctx.fillStyle = value.colour;
                ctx.fillText(value.text, value.x, value.y);
            });
        },
        
        drawGame: function(){
            this.drawDrop();
            this.drawCoinsAndPeople();
            this.drawPrizes();
        },
        
        drawDrop: function(){
            ctx.textAlign = "center";
            ctx.font = "22px Moire";
            ctx.fillStyle = "black";
            
            dropChanges[0].y = dropChanges[1].y = canvas.height/3 + 60;
            dropChanges[0].x = leftCenter - 50;//ctx.measureText(topColours[activeDrop].text).width;
            dropChanges[1].x = leftCenter + 50;//ctx.measureText(topColours[activeDrop].text).width;
            drop[0].x = leftCenter;
            drop[0].y = canvas.height/2;
            
            ctx.fillText("Drop From: ", leftCenter, canvas.height/3 + 30);
            ctx.fillStyle = dropChanges[0].colour;
            ctx.font = "bold 28px Moire";
            ctx.fillText(dropChanges[0].text, dropChanges[0].x, dropChanges[0].y);
            ctx.fillStyle = "black";
            ctx.font = "22px Moire";
            ctx.fillText(topColours[activeDrop].text, leftCenter, dropChanges[0].y);
            ctx.fillStyle = dropChanges[1].colour;
            ctx.font = "bold 28px Moire";
            ctx.fillText(dropChanges[1].text, dropChanges[1].x, dropChanges[1].y);
            
            ctx.font = "32px Moire";
            ctx.fillStyle = drop[0].colour;
            ctx.fillText(drop[0].text, drop[0].x, drop[0].y);
            ctx.fillStyle = "black";
        },
        
        drawCoinsAndPeople: function(){
            ctx.textAlign = "center";
            ctx.font = "22px Moire";
            ctx.fillStyle = "black";
            ctx.fillText("Coins Left: " + coins, leftCenter, 200);
            ctx.fillText("People Saved: " + people, leftCenter, 225);
        },
        
        drawPrizes: function(){
            ctx.textAlign = "center";
            ctx.font = "22px Moire";
            ctx.fillStyle = "black";
            var offsetY = canvas.height/1.7;
            
            ctx.fillText("Current Prizes: ", leftCenter, offsetY);
            offsetY += 10;
            
            $.each(currentPrizes, function( index, value ) {
                offsetY += 25;
                ctx.fillText(baseColours[index] + ": " + prizes[value].text, leftCenter, offsetY);
            });  
            
            $.each(back, function( index, value ) {
                ctx.fillStyle = value.colour;
                ctx.fillText(value.text, value.x, value.y);
            });
        },
        
        drawGameOver: function(){
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.font = "22px Moire";
            var offsetY = 175;
            
            ctx.fillText("Game Over", leftCenter, offsetY);
            offsetY += 25;
            ctx.fillText("You saved " + people + " people!", leftCenter, offsetY);
            
            $.each(back, function( index, value ) {
                ctx.fillStyle = value.colour;
                ctx.fillText(value.text, value.x, value.y);
            });
        },
        
        drawInstructions: function(){
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.font = "22px Moire";
            var offsetY = 175;
            
            $.each(instructions, function( index, value ) {
                ctx.fillText(value, leftCenter, offsetY);
                offsetY += 25;
            });
            
            $.each(back, function( index, value ) {
                ctx.fillStyle = value.colour;
                ctx.fillText(value.text, value.x, value.y);
            });
        },
        
        doDrop: function(){
            if(coins > 0)
            {
                if(!dropping)
                {
                    var ballPos = ballDefault;
                    
                    //ballPos[2] = (Math.random() * ballBoundaries[activeDrop].zMax)+ ballBoundaries[activeDrop].zMin;
                    ballPos[2] = Math.floor(Math.random()*(ballBoundaries[activeDrop].zMax-ballBoundaries[activeDrop].zMin+1)+ballBoundaries[activeDrop].zMin);
                    
                    ball.setPosition(ballPos);
                    ball.rigidbody.syncEntityToBody();
                    dropping = true;
                    coins--;
                    this.drawLeft();
                }
            }
        },
        
        reset: function(){
            people = 0;
            coins = 1;
            activeDrop = 0;
            dropping = false;
        }
    };

    return Ui;
});
