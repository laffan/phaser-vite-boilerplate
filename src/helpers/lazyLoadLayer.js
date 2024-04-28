// 🌺 lazyLayer.js
// -------------------------------

function addTextureUrlToObject(scene, object, JSONkey) {
  const json = scene.cache.json.get(JSONkey);

  let objectTile;

  // Find tile
  json.tilesets.forEach((tileset) => {
    if (tileset.hasOwnProperty("tiles")) {
      tileset.tiles.forEach((tile) => {
        if (tileset.firstgid + tile.id === object.gid) {
          objectTile = tile;
        }
      });
    } else {
      if (tileset.firstgid === object.gid) {
        objectTile = tile;
      }
    }
  });

  object.image = objectTile.image;
}

export function addLazyLayers(scene, newLayers, JSONkey) {
  // loop through collectionNames and add to this.registry.lazyCollections
  const LayerProp = "LAZY_" + JSONkey + "_Layers"; // for re-use

  const json = scene.cache.json.get(JSONkey);
  // Add image urls to layer object.
  newLayers.forEach((layer) => {
    // 1. Find layer in JSON
    const layerData = json.layers.find((l) => l.name === layer);

    layerData.objects.forEach((object) => {
      addTextureUrlToObject(scene, object, JSONkey);
    });
  });

  // Add layer to registry
  if (!scene.registry.hasOwnProperty(LayerProp)) {
    scene.registry.set(LayerProp, []);
  }

  scene.registry.set(LayerProp, [
    ...scene.registry.get(LayerProp),
    ...newLayers,
  ]);
}

export function checkLayerVisability(
  scene,
  JSONkey,
  worldView,
  options = {
    padding: 30,
  }
) {
  const LayerProp = "LAZY_" + JSONkey + "_Layers";

  if (scene.registry.has(LayerProp)) {
    const layers = scene.registry.get(LayerProp);
    const json = scene.cache.json.get(JSONkey);

    layers.forEach((layer) => {
      // 1. Find layer in JSON
      const layerData = json.layers.find((l) => l.name === layer);

      // Loop through objects in layers and check visibility of each one
      layerData.objects.forEach((object) => {
        if (object.visible) {
          if (isObjectInView(object, worldView, scene)) {
            loadObject(object, json, scene);
          } else {
            unloadObject(object, scene);
          }
        }
      });
    });
  } else {
    console.log("Key not found in registry:", LayerProp);
  }

  function isObjectInView(object, worldView, scene) {
    let objectRect = new Phaser.Geom.Rectangle(
      object.x,
      object.y - object.height,
      object.width,
      object.height
    );

    // DEBUG SQUARES AROUND OBJECT SPACES
    // ----------------------------------------------
    // const graphics = scene.add.graphics();
    // graphics.lineStyle(2, 0xff0000); // Red color and line thickness
    // graphics.strokeRectShape(objectRect);

    return Phaser.Geom.Intersects.RectangleToRectangle(objectRect, worldView);
  }

  function loadObject(object, json, scene) {
    // Construct a unique key for each object
    
    object.key =
      object.image.split("/").pop().split(".")[0] +
      "_" +
      object.x +
      "_" +
      object.y;

    if (!object.loaded) {
      if (!scene.textures.exists(object.key)) {
        // Load asset only if not already loaded
        scene.load.image(object.key, object.image);

        scene.load.once(
          "complete",
          () => {
            object.loaded = true;
            addObject(object, scene);
          },
          scene // Context for the listener
        );

        scene.load.once(
          "loaderror",
          (file) => {
            console.error("Failed to load image:", file.src);
          },
          scene // Context for the listener
        );

        scene.load.start();
      } else {
        // The texture is already available, just add the object
        addObject(object, scene);
      }
    } else if (!object.isAdded) {
      // Object was loaded but check if it's added
      addObject(object, scene);
    }
  }
}

function addObject(object, scene) {
  object.isAdded = true;
  const img = scene.add.image(object.x, object.y, object.key);
  img.setOrigin(0, 1);
}

function unloadObject(object, scene) {
  let objectToDestroy = scene.children.getByName(object.key);
  if (objectToDestroy && object.loaded) {
    scene.textures.removeKey(objectToDestroy.key);
    object.destroy();
  } else {
    // console.log("No texture found on object or already destroyed");
  }
}
