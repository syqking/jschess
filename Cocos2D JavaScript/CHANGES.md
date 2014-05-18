v0.2
====

New Features
------------

* Completely rewrote and separated the build system into a new project called [Jah][jah]
* Optionally load resources (images, tile maps, etc.) externally rather than embedding
* ProgressBar while preloading external resources
* Parse TMX Map properties
* Opacity property for all Nodes
* Added LabelAtlas
* Use requestAnimationFrame for smoother animations
* New Actions added by Marc Mauger
  * BezierBy
  * BezierTo
  * Blink
  * CallFunc
  * DelayTime
  * EaseBackIn
  * EaseBackInOut
  * EaseBackOut
  * EaseBounce
  * EaseBounceIn
  * EaseBounceInOut
  * EaseBounceOut
  * EaseElastic
  * EaseElasticInOut
  * EaseElasticOut
  * EaseIn
  * EaseOut
  * EastSineOut
  * FadeIn
  * FadeOut
  * FadeTo
  * Follow
  * Hide
  * JumpBy
  * JumpTo
  * Show
  * Spawn
  * ToggleVisibility
* Scene Transitions added by Marc Mauger
  * TransitionRotoZoom
  * TransitionMoveInL
  * TransitionMoveInR
  * TransitionMoveInT
  * TransitionMoveInB
  * TransitionSlideInL
  * TransitionSlideInR
  * TransitionSlideInT
  * TransitionSlideInB


Bug Fixes
---------

* 'event' module renamed to 'events' to avoid conflict with DOM events
* Fixed Sprites not always drawing in the correct location after changing their contentSize
* Fixed anchor point not being properly calculated
* Fixed MenuItemSprite not drawing its children


v0.1
====

Everything

[jah]: https://github.com/ryanwilliams/jah
