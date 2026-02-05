				(function(){
					var track = document.getElementById('carouselTrack');
					var lb    = document.getElementById('carouselLB');
					var lbImg = document.getElementById('carouselLBImg');
					var lbL   = document.getElementById('lbLeft');
					var lbR   = document.getElementById('lbRight');
					var zL    = document.getElementById('czL');
					var zR    = document.getElementById('czR');
					var iv    = null;
					var coastIv = null;

					var minSpeed = 1;
					var maxSpeed = 7;
					var rampTime = 1800;
					var startTime = 0;
					var gap = 6;
					var currentSpeed = 0;
					var currentDir = 0;
					var friction = 0.93;

					var touchStartX = 0;
					var touchLastX = 0;
					var touchVelocity = 0;
					var touchDragging = false;

					// image source list & current index
					var carouselImgs = Array.from(track.querySelectorAll('img.screen'));
					var readmeImgs = Array.from(document.querySelectorAll('#readme img:not(.screen)'));
					// .filter(function(img){
					// 	return img.naturalWidth > 255 && img.naturalHeight > 255;
					// 	});
					var allImgs = carouselImgs.concat(readmeImgs);
					var srcs = allImgs.map(function(img){ return img.src; });
					var currentIndex = 0;

					document.body.appendChild(lb);

					var origItems = Array.from(track.querySelectorAll('img.screen'));
					var itemCount = origItems.length;

					for (var i = itemCount - 1; i >= 0; i--)
						track.insertBefore(origItems[i].cloneNode(true), track.firstChild);
					origItems.forEach(function(img){
						track.appendChild(img.cloneNode(true));
					});

					var setWidth = 0;

					function calcSetWidth(){
						var w = 0;
						var children = track.children;
						for (var i = 0; i < itemCount; i++)
							w += children[i].offsetWidth + gap;
						return w;
					}

					function wrapScroll(){
						if (track.scrollLeft >= 2 * setWidth)
							track.scrollLeft -= setWidth;
						else if (track.scrollLeft < setWidth)
							track.scrollLeft += setWidth;
					}

					function initScroll(){
						setWidth = calcSetWidth();
						if (!setWidth) return;
						track.style.scrollBehavior = 'auto';
						track.scrollLeft = setWidth;
					}

					window.addEventListener('load', initScroll);
					initScroll();

					function stopCoast(){ if(coastIv){ clearInterval(coastIv); coastIv = null; } }

					function coastFrom(speed, dir){
						stopCoast();
						var v = Math.abs(speed);
						if(v < 0.5) return;
						coastIv = setInterval(function(){
							v *= friction;
							if(v < 0.3){ stopCoast(); return; }
							track.scrollLeft += dir * v;
							wrapScroll();
						}, 12);
					}

					function startScroll(dir){
						stopCoast();
						if(iv){ clearInterval(iv); iv = null; }
						currentDir = dir;
						startTime = Date.now();
						iv = setInterval(function(){
							var elapsed = Date.now() - startTime;
							var t = Math.min(elapsed / rampTime, 1);
							currentSpeed = minSpeed + (maxSpeed - minSpeed) * t;
							track.scrollLeft += currentDir * currentSpeed;
							wrapScroll();
						}, 12);
					}

					function stopScroll(){
						if(iv){ clearInterval(iv); iv = null; }
						coastFrom(currentSpeed, currentDir);
					}

					zL.addEventListener('mouseenter', function(){ startScroll(-1); });
					zL.addEventListener('mouseleave', stopScroll);
					zR.addEventListener('mouseenter', function(){ startScroll(1); });
					zR.addEventListener('mouseleave', stopScroll);

					// --- touch handling ---
					track.addEventListener('touchstart', function(e){
						stopCoast();
						touchDragging = true;
						touchStartX = e.touches[0].clientX;
						touchLastX = touchStartX;
						touchVelocity = 0;
					}, {passive: true});

					track.addEventListener('touchmove', function(e){
						if (!touchDragging) return;
						var x = e.touches[0].clientX;
						var dx = touchLastX - x;
						touchVelocity = dx;
						touchLastX = x;
						track.scrollLeft += dx;
						wrapScroll();
						e.preventDefault();
					}, {passive: false});

					track.addEventListener('touchend', function(e){
						if (!touchDragging) return;
						touchDragging = false;
						var dir = touchVelocity > 0 ? 1 : -1;
						coastFrom(Math.abs(touchVelocity) * 2, dir);
					});

					// --- lightbox ---
					function showImage(index){
						currentIndex = ((index % srcs.length) + srcs.length) % srcs.length;
						lbImg.src = srcs[currentIndex];
					}

					track.addEventListener('click', function(e){
						if (Math.abs(touchLastX - touchStartX) > 10) return;
						if(e.target.tagName === 'IMG'){
							// find matching source index
							var clicked = e.target.src;
							for (var i = 0; i < srcs.length; i++){
								if (srcs[i] === clicked){ currentIndex = i; break; }
							}
							lbImg.src = clicked;
							lb.classList.add('open');
						}
					});

					// lightbox for non-carousel images
					readmeImgs.forEach(function(img){
						img.style.cursor = 'zoom-in';
						img.addEventListener('click', function(e){
							var clicked = e.target.src;
							for (var i = 0; i < srcs.length; i++){
								if (srcs[i] === clicked){ currentIndex = i; break; }
							}
							lbImg.src = clicked;
							lb.classList.add('open');
						});
					});

					lbL.addEventListener('click', function(e){
						e.stopPropagation();
						showImage(currentIndex - 1);
					});

					lbR.addEventListener('click', function(e){
						e.stopPropagation();
						showImage(currentIndex + 1);
					});

					lb.addEventListener('click', function(e){
						if(e.target !== lbImg && e.target !== lbL && e.target !== lbR){
							lb.classList.remove('open');
						}
					});

					document.addEventListener('keydown', function(e){
						if (!lb.classList.contains('open')) return;
						if(e.key === 'Escape') lb.classList.remove('open');
						if(e.key === 'ArrowLeft') showImage(currentIndex - 1);
						if(e.key === 'ArrowRight') showImage(currentIndex + 1);
					});
				})();