"""
File: asteroids.py
Original Author: Br. Burton
Designed to be completed by others
This program implements the asteroids game.
"""
import arcade
import random
import math

# These are Global constants to use throughout the game
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

BULLET_RADIUS = 30
BULLET_SPEED = 10
BULLET_LIFE = 60

SHIP_TURN_AMOUNT = 3
SHIP_THRUST_AMOUNT = .01 # used to be 10
SHIP_RADIUS = 30

INITIAL_ROCK_COUNT = 5

BIG_ROCK_SPIN = 1
BIG_ROCK_SPEED = .5 # used to be 1.5
BIG_ROCK_RADIUS = 30 # used to be 15

MEDIUM_ROCK_SPIN = -2
MEDIUM_ROCK_RADIUS = 15 # used to be 5

SMALL_ROCK_SPEED = .75 # didn't exist beforehand
SMALL_ROCK_SPIN = 5
SMALL_ROCK_RADIUS = 8 # used to be 2




class Game(arcade.Window):
 #   """
#    This class handles all the game callbacks and interaction
#    This class will then call the appropriate functions of
#    each of the above classes.
#    You are welcome to modify anything in this class.
#    """

    def __init__(self, width, height):
 #       """
#        Sets up the initial conditions of the game
#        :param width: Screen width
#        :param height: Screen height
#        """
        super().__init__(width, height)
        arcade.set_background_color(arcade.color.SMOKY_BLACK)
        self.held_keys = set()
        self.asteroids = []
        self.asteroids_m = []
        self.asteroids_s = []
        self.ship = []
        self.bullets = []
        self.make_asteroids = False
        self.make_ship = False
        self.make_bullets = False
        self.score = 0
        self.machine_gun_mode = False
        self.end = False

 #       self.make_bullets = False

        # TODO: declare anything here you need the game class to track

    def on_draw(self):

    #       Called automatically by the arcade framework.
    #       Handles the responsibility of drawing all elements.
    #       """
       # clear the screen to begin drawing
        arcade.start_render()

        while self.make_asteroids == False:
           for i in range(5):
               asteroid_l = Large()
               self.asteroids.append(asteroid_l)
               self.make_asteroids = True
               
        while self.make_ship == False:
           ship = Ship()
           self.ship.append(ship)
           self.make_ship = True
        
        if len(self.asteroids)< 3:
            asteroid = Large()
            self.asteroids.append(asteroid)
           
        for ship in self.ship:
            ship.draw()
 
        for bullet in self.bullets:
            bullet.draw()
           
        for asteroid in self.asteroids:
           asteroid.draw()
           
        for asteroid in self.asteroids_m:
            asteroid.draw()

        for asteroid in self.asteroids_s:
            asteroid.draw()
            
        self.draw_score()
        
        if self.end == True:
            self.draw_finalscore()
    
    def draw_score(self):
        """
        Puts the current score on the screen
        """
        score_text = "Score: {}".format(self.score)
        start_x = 10
        start_y = SCREEN_HEIGHT - 20
        arcade.draw_text(score_text, start_x=start_x, start_y=start_y, font_size=12, color=arcade.color.RED)
        
    def draw_finalscore(self):
        """
        Puts the current score on the screen
        """
        
        if self.score < 50:
            message = "Newbie"
        elif self.score < 100 and self.score > 50:
            message = "Intermediate Asteroid Fighter"
        elif self.score < 150 and self.score > 100:
            message = "Senior Asteroid Fighter"
        elif self.score > 150:
            message = "Master Asteroid Fighter"
        score_text = "Score: {}\n Congrats! You are a {} \n Press enter to play again \n \n(Press z for machine gun mode)".format(self.score, message)
        start_x = SCREEN_WIDTH/8
        start_y = SCREEN_HEIGHT/2
        arcade.draw_text(score_text, start_x=start_x, start_y=start_y, font_size=24, color=arcade.color.RED) 
            
    def update(self, delta_time):
    #        """
    #        Update each object in the game.
    #        :param delta_time: tells us how much time has actually elapsed
    #        """
        self.check_keys()
        self.check_collisions()
        self.draw_finalscore()
        # TODO: Tell everything to advance or move forward one step in time
        
        for ship in self.ship:
            if ship.up == True:
                ship.advance()
                ship.check_off_screen()

        for asteroid in self.asteroids:
            asteroid.advance(delta_time)
            asteroid.rotate()
            asteroid.check_off_screen()

        
        for asteroid in self.asteroids_m:
            asteroid.advance()
            asteroid.rotate()
            asteroid.check_off_screen()

            
        for asteroid in self.asteroids_s:
            asteroid.advance()
            asteroid.rotate()
            asteroid.check_off_screen()

            
        for bullet in self.bullets:
            bullet.advance()
            bullet.check_off_screen()
        
        # TODO: Check for collisions
        
    def check_keys(self):
    #       """
    #        This function checks for keys that are being held down.
    #        You will need to put your own method calls in here.
    #        """
        if arcade.key.LEFT in self.held_keys:
            for ship in self.ship:
                ship.angle = ship.angle + SHIP_TURN_AMOUNT

        if arcade.key.RIGHT in self.held_keys:
            for ship in self.ship:
                ship.angle = ship.angle - SHIP_TURN_AMOUNT

        if arcade.key.UP in self.held_keys:
            if not arcade.key.LEFT in self.held_keys:
                if not arcade.key.RIGHT in self.held_keys:
                    for ship in self.ship:
                        ship.up = True
                        ship.advance_angle = ship.angle
                        ship.advance()
                        ship.increase_velocity()
                    for bullet in self.bullets:
                        bullet.velocity.dx = ship.velocity.dx
                        bullet.velocity.dy = ship.velocity.dy
                        


        if arcade.key.DOWN in self.held_keys:
            for ship in self.ship:
                ship.up = False
                ship.advance() 

        # Machine gun mode...
        if self.machine_gun_mode == True:
            for ship in self.ship:
                if ship.alive == False:
                    pass
                else:
                    if arcade.key.SPACE in self.held_keys:
                        bullet = Bullets()
                        self.bullets.append(bullet)
                        for ship in self.ship:
                            x = ship.center.x
                            y = ship.center.y
                            ship_angle = ship.angle
                            
                        bullet.fire(x,y,ship_angle)
            
    def check_collisions(self):
        """
        Checks to see if bullets have hit targets.
        Removes dead items.
        :return:
        """
        
        for bullet in self.bullets:
            for asteroid in self.asteroids:

                # Make sure they are both alive before checking for a collision
                if bullet.alive and asteroid.alive:
                    too_close = bullet.radius + asteroid.radius

                    if (abs(bullet.center.x - asteroid.center.x) < too_close and
                                abs(bullet.center.y - asteroid.center.y) < too_close):
                        # its a hit!
                        bullet.alive = False
                        asteroid.alive = False
                        self.score += asteroid.hit()


        for bullet in self.bullets:
            for asteroid in self.asteroids_m:

                # Make sure they are both alive before checking for a collision
                if bullet.alive and asteroid.alive:
                    too_close = bullet.radius + asteroid.radius

                    if (abs(bullet.center.x - asteroid.center.x) < too_close and
                                abs(bullet.center.y - asteroid.center.y) < too_close):
                        # its a hit!
                        bullet.alive = False
                        asteroid.alive = False
                        self.score += asteroid.hit()            

        for bullet in self.bullets:
            for asteroid in self.asteroids_s:

                # Make sure they are both alive before checking for a collision
                if bullet.alive and asteroid.alive:
                    too_close = bullet.radius + asteroid.radius

                    if (abs(bullet.center.x - asteroid.center.x) < too_close and
                                abs(bullet.center.y - asteroid.center.y) < too_close):
                        # its a hit!
                        bullet.alive = False
                        asteroid.alive = False
                        self.score += asteroid.hit()
                        
        for bullet in self.bullets:
            for ship in self.ship:
                    
                    if (abs(bullet.center.x - ship.center.x) > 240 or abs(bullet.center.y - ship.center.y) > 240):
                        bullet.alive = False

        for asteroid in self.asteroids:
            for ship in self.ship:

                if asteroid.alive and ship.alive:
                    too_close = asteroid.radius + ship.radius

                    if (abs(asteroid.center.x - ship.center.x) < too_close and
                                abs(asteroid.center.y - ship.center.y) < too_close):
                        # its a hit!
                        asteroid.alive = False
                        ship.alive = False

        for asteroid in self.asteroids_m:
            for ship in self.ship:

                if asteroid.alive and ship.alive:
                    too_close = asteroid.radius + ship.radius

                    if (abs(asteroid.center.x - ship.center.x) < too_close and
                                abs(asteroid.center.y - ship.center.y) < too_close):
                        # its a hit!
                        asteroid.alive = False
                        ship.alive = False

        for asteroid in self.asteroids_s:
            for ship in self.ship:

                if asteroid.alive and ship.alive:
                    too_close = asteroid.radius + ship.radius

                    if (abs(asteroid.center.x - ship.center.x) < too_close and
                                abs(asteroid.center.y - ship.center.y) < too_close):
                        # its a hit!
                        asteroid.alive = False
                        ship.alive = False
                        
        # Now, check for anything that is dead, and remove it
        self.cleanup_zombies()

    def cleanup_zombies(self):
        """
        Removes any dead bullets or targets from the list.
        :return:
        """
        for bullet in self.bullets:
            if not bullet.alive:
                self.bullets.remove(bullet)

        for asteroid in self.asteroids:
            if not asteroid.alive:
                x = asteroid.center.x
                y = asteroid.center.y
                self.asteroids.remove(asteroid)
                for i in range(1):
                    dy = float(random.uniform(0, 1)) # medium asteroid going up
                    asteroid = Medium(x,y, dy)
                    self.asteroids_m.append(asteroid)
                    dy = float(random.uniform(0, -1)) # medium asteroid going down
                    asteroid = Medium(x,y, dy)
                    self.asteroids_m.append(asteroid)
                    dx = float(random.uniform(0, 2)) # small asteroid going to the right
                    dy = float(random.uniform(0, 0)) # small asteroid not going up or down
                    asteroid = Small(x,y, dx, dy)
                    self.asteroids_s.append(asteroid)
        
        for asteroid in self.asteroids_m:
            if not asteroid.alive:
                x = asteroid.center.x
                y = asteroid.center.y
                self.asteroids_m.remove(asteroid)
                for i in range(1):
                    dy = float(random.uniform(0, 1)) # small asteroid going up
                    dx = float(random.uniform(0,1)) # small asteroid going to the right
                    asteroid = Small(x,y, dx, dy)
                    self.asteroids_s.append(asteroid)
                    dy = float(random.uniform(-1,0)) # small asteroid going down
                    dx = float(random.uniform(-1,0)) # small asteroid going to the left
                    asteroid = Small(x,y, dx, dy)
                    self.asteroids_s.append(asteroid)                
                
        for asteroid in self.asteroids_s:
            if not asteroid.alive:
                x = asteroid.center.x
                y = asteroid.center.y
                self.asteroids_s.remove(asteroid)
        
        for ship in self.ship:
            if not ship.alive:
                self.ship.remove(ship)
                self.end = True

    def on_key_press(self, key: int, modifiers: int):
    #       """
    #        Puts the current key in the set of keys that are being held.
    #        You will need to add things here to handle firing the bullet.
    #        """
        for ship in self.ship:
            if ship.alive == True:
                self.held_keys.add(key)

        if key == arcade.key.SPACE:
            for ship in self.ship:
                if ship.alive == False:
                    pass
                # TODO: Fire the bullet here!
                else:
                    bullet = Bullets()
                    self.bullets.append(bullet)
                    for ship in self.ship:
                        x = ship.center.x
                        y = ship.center.y
                        ship_angle = ship.angle
                        
                    bullet.fire(x,y,ship_angle)
          
        if key == arcade.key.ENTER:
            self.asteroids = []
            self.asteroids_m = []
            self.asteroids_s = []
            self.ship = []
            self.bullets = []
            self.make_ship = False
            self.make_asteroids = False
            self.end = False
            arcade.run()
            
        if key == arcade.key.Z:
            self.machine_gun_mode = True
            
    def on_key_release(self, key: int, modifiers: int):
    #       """
    #       Removes the current key from the set of held keys.
    #       """
        if key in self.held_keys:
            self.held_keys.remove(key)

class Point:
    def __init__(self):    
        self.x = float(random.uniform(0, 800))
        self.y = float(random.uniform(0, 600))
    
class Velocity:
    def __init__(self):
        self.dx = SHIP_THRUST_AMOUNT
        self.dy = SHIP_THRUST_AMOUNT

class FlyingObject:
    def __init__(self):
        self.center = Point()
        self.velocity = Velocity()
        self.radius = 0
        self.alive = True
        self.angle = 0
        
    def check_off_screen(self):
        """
        Checks to see if bullets or targets have left the screen
        and if so, removes them from their lists.
        :return:
        """
        if self.center.x > SCREEN_WIDTH:
            self.center.x = 0
        if self.center.y > SCREEN_HEIGHT:
            self.center.y = 0
        if self.center.x < 0:
            self.center.x = SCREEN_WIDTH
        if self.center.y < 0:
            self.center.y = SCREEN_HEIGHT

class Ship(FlyingObject):
    
    def __init__(self):
        super().__init__()
        self.center.x = SCREEN_WIDTH/2
        self.center.y = SCREEN_HEIGHT/2
        self.up = False
        self.ship_angle = 0
        self.radius = SHIP_RADIUS
        self.advance_angle = 0

    def advance(self):
        if self.up == True:
            angle = self.advance_angle + 90
            self.center.x += self.velocity.dx * math.cos(math.radians(angle))
            self.center.y += self.velocity.dy * math.sin(math.radians(angle)) 

        if self.up == False:
            angle = self.angle - 270
            self.center.x += math.cos(math.radians(angle)) * self.velocity.dx * -1
            self.center.y += math.sin(math.radians(angle)) * self.velocity.dy * -1
            self.velocity.dx = SHIP_THRUST_AMOUNT
            self.velocity.dy = SHIP_THRUST_AMOUNT
        
    def increase_velocity(self):
        self.velocity.dx += SHIP_THRUST_AMOUNT
        self.velocity.dy += SHIP_THRUST_AMOUNT
    
    def draw(self):
        img = "./images/playerShip1_orange.png"
        texture = arcade.load_texture(img)

        width = texture.width
        height = texture.height
        alpha = 1 # For transparency, 1 means not transparent

        x = self.center.x
        y = self.center.y
        angle = self.angle
        arcade.draw_texture_rectangle(x, y, width, height, texture, angle, alpha)

    def set_angle(self, angle):
        self.ship_angle = angle
    
    def get_advance_angle(self):
        return self.angle
    
    def collision(self):
        pass
    
class Bullets(FlyingObject):
    
    def __init__(self):
        self.radius = BULLET_RADIUS
        super().__init__()
    
    def dead(self):
        pass
    
    def advance(self):
        angle = self.angle - 270
        if self.velocity.dx > 1:
            self.center.x += math.cos(math.radians(angle)) * BULLET_SPEED * self.velocity.dx
            self.center.y += math.sin(math.radians(angle)) * BULLET_SPEED * self.velocity.dy
        else:
            self.center.x += math.cos(math.radians(angle)) * BULLET_SPEED
            self.center.y += math.sin(math.radians(angle)) * BULLET_SPEED
       
        
    def draw(self):
        img = "./images/laserBlue01.png"
        texture = arcade.load_texture(img)

        width = texture.width
        height = texture.height
        alpha = 1 # For transparency, 1 means not transparent
        angle = self.angle + 90
        x = self.center.x
        y = self.center.y
        arcade.draw_texture_rectangle(x, y, width, height, texture, angle, alpha) 
    
    def hit(self):
        pass
    
    def fire(self, x, y, angle):
        self.center.x = x
        self.center.y = y
        self.angle = angle
    
class Large(FlyingObject):
    
    def __init__(self):
        super().__init__()
        self.center.x = float(random.uniform(-300, 300))
        self.radius = BIG_ROCK_RADIUS

        self.velocity_dx = float(random.uniform(-1, 1))
        self.velocity_dy = float(random.uniform(-1, 1))

    def advance(self, delta_time):
        self.center.x += self.velocity_dx * BIG_ROCK_SPEED
        self.center.y += self.velocity_dy * BIG_ROCK_SPEED 
    
    def collision(self):
        pass
    
    def draw(self):
        img = "./images/meteorGrey_big1.png"
        texture = arcade.load_texture(img)

        width = texture.width
        height = texture.height
        alpha = 1 # For transparency, 1 means not transparent

        x = self.center.x
        y = self.center.y
#        angle = self.angle
        arcade.draw_texture_rectangle(x, y, width, height, texture, self.angle, alpha)    

    def rotate(self):
        self.angle += BIG_ROCK_SPIN
    
    def hit(self):
        return 1
        
class Medium(FlyingObject):
    
    def __init__(self, x, y, dy):
        super().__init__()
        
        self.velocity.dy = dy
        self.radius = MEDIUM_ROCK_RADIUS
        self.center.x = x
        self.center.y = y
        self.velocity.dx = float(random.uniform(-1, 1))
    
    def advance(self):
        self.center.x += self.velocity.dx * BIG_ROCK_SPEED + .2
        self.center.y += self.velocity.dy * BIG_ROCK_SPEED + .2
    
    def collision(self):
        pass
    
    def draw(self):
        img = "./images/meteorGrey_med1.png"
        texture = arcade.load_texture(img)

        width = texture.width
        height = texture.height
        alpha = 1 # For transparency, 1 means not transparent

        x = self.center.x
        y = self.center.y
#        angle = self.angle
        arcade.draw_texture_rectangle(x, y, width, height, texture, self.angle, alpha) 
    
    def rotate(self):
        self.angle += MEDIUM_ROCK_SPIN
        
    def hit(self):
        return 2    
        
class Small(FlyingObject):
    
    def __init__(self, x, y, dx, dy):
        super().__init__()
        
        self.velocity.dy = dy
        self.radius = SMALL_ROCK_RADIUS
        self.center.x = x
        self.center.y = y
        self.velocity.dy = dx

    
    def advance(self):
        self.center.x += self.velocity.dx * BIG_ROCK_SPEED + .7
        self.center.y += self.velocity.dy * BIG_ROCK_SPEED + .7
    
    def draw(self):
        img = "./images/meteorGrey_small1.png"
        texture = arcade.load_texture(img)

        width = texture.width
        height = texture.height
        alpha = 1 # For transparency, 1 means not transparent

        x = self.center.x
        y = self.center.y
#        angle = self.angle
        arcade.draw_texture_rectangle(x, y, width, height, texture, self.angle, alpha) 
    
    def rotate(self):
        self.angle += SMALL_ROCK_SPIN

    def hit(self):
        return 3
    
"""

img = "/Users/andreasmartinson/images/playerShip1_orange.png"
texture = arcade.load_texture(img)

width = texture.width
height = texture.height
alpha = 1 # For transparency, 1 means not transparent

x = self.center.x
y = self.center.y
angle = self.angle
            
"""

# Creates the game and starts it going
window = Game(SCREEN_WIDTH, SCREEN_HEIGHT)
arcade.run()

### TO DO ###
 
