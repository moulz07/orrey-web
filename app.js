// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for camera interaction
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
scene.add(ambientLight);

// Add a directional light to simulate the sun
const sunLight = new THREE.PointLight(0xffffff, 1, 500);
sunLight.position.set(0, 0, 0); // Position light at the sun
scene.add(sunLight);

// Sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Add label for the Sun
const sunLabelDiv = document.createElement('div');
sunLabelDiv.className = 'label';
sunLabelDiv.textContent = 'Sun';
sunLabelDiv.style.position = 'absolute';
sunLabelDiv.style.color = 'white';
sunLabelDiv.style.fontFamily = 'Arial';
sunLabelDiv.style.fontSize = '14px';
document.body.appendChild(sunLabelDiv);

// Define planet data (distance from Sun, size, color, speed)
const planets = [
    { name: 'Mercury', distance: 5, size: 0.5, color: 0xaaaaaa, speed: 0.2 },
    { name: 'Venus', distance: 7, size: 0.9, color: 0xffcc00, speed: 0.1 },
    { name: 'Earth', distance: 10, size: 1, color: 0x0000ff, speed: 0.07 },
    { name: 'Mars', distance: 14, size: 0.7, color: 0xff0000, speed: 0.05 },
    { name: 'Jupiter', distance: 20, size: 1.8, color: 0xff8800, speed: 0.03 },
    { name: 'Saturn', distance: 26, size: 1.5, color: 0xffd700, speed: 0.02 },
    { name: 'Uranus', distance: 32, size: 1.2, color: 0x00ffff, speed: 0.015 },
    { name: 'Neptune', distance: 38, size: 1.1, color: 0x0000ff, speed: 0.01 }
];

// Helper function to create a planet
function createPlanet(planet) {
    const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
    const material = new THREE.MeshLambertMaterial({ color: planet.color });
    const mesh = new THREE.Mesh(geometry, material);

    // Create a group for each planet to help with orbital rotation
    const group = new THREE.Group();
    group.position.set(planet.distance, 0, 0); // Set the initial position
    group.add(mesh); // Add the planet mesh to the group
    mesh.name = planet.name; // Set the planet's name for interaction
    scene.add(group);

    return { mesh, group, speed: planet.speed, distance: planet.distance };
}

// Function to create an orbit path
function createOrbit(distance) {
    const curve = new THREE.EllipseCurve(
        0, 0, // ax, aY
        distance, distance, // xRadius, yRadius
        0, 2 * Math.PI, // StartAngle, EndAngle
        false // clockwise
    );
    
    const points = curve.getPoints(100);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);

    orbit.rotation.x = Math.PI / 2; // Rotate to lay flat
    scene.add(orbit);
}

// Create planets and add to scene
const planetData = planets.map(createPlanet);

// Create orbits for planets
planets.forEach((planet) => createOrbit(planet.distance));

// Add stars background
function addStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

addStars(); // Call the function to add stars

// Create the Earth's Moon
const moonGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const moonMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
const earthGroup = planetData.find(p => p.mesh.name === 'Earth').group;
const moonGroup = new THREE.Group();
moonGroup.add(moon);
earthGroup.add(moonGroup); // Add moon to Earth's group

// Set camera position
camera.position.set(0, 5, 50);
controls.update(); // Update camera controls

// Handle click event to display planet name
window.addEventListener('click', (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(planetData.map(p => p.mesh));

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        document.getElementById('details').innerText = `Selected Planet: ${selectedObject.name}`;
    }
});

// Main animation loop for updating planet positions
let time = 0; // Time variable to track planet motion

function animate() {
    requestAnimationFrame(animate);

    // Rotate planets around the Sun using trigonometry
    planetData.forEach((planet) => {
        planet.group.position.x = planet.distance * Math.cos(time * planet.speed);
        planet.group.position.z = planet.distance * Math.sin(time * planet.speed);
    });

    // Rotate the Moon around the Earth
    const moonDistance = 1.5; // Distance from Earth
    const moonSpeed = 0.5; // Speed of the moon's orbit
    moonGroup.position.x = moonDistance * Math.cos(time * moonSpeed);
    moonGroup.position.z = moonDistance * Math.sin(time * moonSpeed);

    // Update Sun label position
    const sunPosition = sun.position.clone();
    sunPosition.project(camera);
    const x = (sunPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = -(sunPosition.y * 0.5 - 0.5) * window.innerHeight;
    sunLabelDiv.style.left = `${x}px`;
    sunLabelDiv.style.top = `${y}px`;

    time += 0.05; // Faster time progression to speed up rotations

    controls.update(); // Allow camera interaction
    renderer.render(scene, camera); // Render the scene
}
animate();

// Handle window resize to adjust camera aspect ratio
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});









