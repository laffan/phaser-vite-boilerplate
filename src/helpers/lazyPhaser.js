// 🌺 useImageCollections.js
// -------------------------------
// Automate the use of image collections with Tiled
//
// Created Feb 17, 2024 by Nate Laffan

// loadJSON
// ----------------------------
// Synchronously load JSON in to the scene registry.

export function loadLazyJSON(scene, JSONkey, filePath) {
  const JSONProp = "LAZY_" + JSONkey + "_JSON";
  // Create a synchronous (blocking) request to get JSON
  var request = new XMLHttpRequest();
  request.open("GET", filePath, false); // false for synchronous request
  request.send(null);

  // If there's a response, load the full JSON in to the registry
  if (request.status === 200) {
    scene.registry.set(JSONProp, JSON.parse(request.responseText));
  } else {
    throw new Error("Failed to load file");
  }
}

export function addLazyLayers(scene, newLayers, JSONkey) {
  // loop through collectionNames and add to this.registry.lazyCollections
  const LayerProp = "LAZY_" + JSONkey + "_Layers"; // for re-use

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
  const JSONProp = "LAZY_" + JSONkey + "_JSON";
  const LayerProp = "LAZY_" + JSONkey + "_Layers";

  if (scene.registry.has(LayerProp) && scene.registry.has(JSONProp)) {
    const layers = scene.registry.get(LayerProp);
    const json = scene.registry.get(JSONProp);
    console.log("JSON:", json);
    console.log("Layers:", layers);

    layers.forEach((layer) => {
      // 1. Find layer in JSON
      const layerData = json.layers.find((l) => l.name === layer);
      console.log(layerData);

      // Loop through objects in layers and check visibility of each one
      layerData.objects.forEach((object) => {
        if (object.visible) {
          if (isObjectInView(object, worldView, scene)) {
            loadObjectTexture(object, json);
          } else {
            unloadObjectTexture(object, json);
          }
        }
      });
    });
  } else {
    console.log("Key not found in registry:", LayerProp);
  }

  function isObjectInView(object, worldView, scene) {
    console.log(object);

    let objectRect = new Phaser.Geom.Rectangle(
      object.x,
      object.y - object.height,
      object.width,
      object.height
    );

    // Draw a red rectangle representing objectRect
    const graphics = scene.add.graphics();
    graphics.lineStyle(2, 0xff0000); // Red color and line thickness
    graphics.strokeRectShape(objectRect);

    return Phaser.Geom.Intersects.RectangleToRectangle(objectRect, worldView);
  }

  function loadObjectTexture(object, json) {
    console.log("Loading GID", object.gid);
  }
  function unloadObjectTexture(object, json) {
    console.log("Confirming GID", object.gid, " is unloaded.");
  }

  // 📍📍📍📍📍 ON DRAG 📍📍📍📍📍

  // 1.  throttle this function down to 300ms or something.

  // 2. Loop through registry.lazyLayers and compare against
  //    the camera rect.

  // 3. Plug in the rest.

  // this.gameData.media.forEach((item) => {
  //   let itemRect = new Phaser.Geom.Rectangle(
  //     item.position[0],
  //     item.position[1],
  //     item.size[0],
  //     item.size[1]
  //   );

  //   if (
  //     Phaser.Geom.Intersects.RectangleToRectangle(itemRect, this.visibleRect)
  //   ) {
  //     if (!this.textures.exists(item.path) && !this.loading.has(item.path)) {
  //       this.loading.add(item.path);

  //       this.load.image(item.path, `/assets/media/${item.path}`);
  //       this.load.once("complete", () => {

  //         this.loading.delete(item.path);
  //         this.add.image(item.position[0], item.position[1], item.path);

  //       });
  //       this.load.once("loaderror", () => {

  //         this.loading.delete(item.path);
  //         console.error("Failed to load image:", item.path);

  //       });
  //       this.load.start();
  //     }
  //   } else {
  //     this.removeImageIfNotVisible(item);
  //   }
  // });
}

// loadSaveCollection
// ----------------------------
// Saves the tile array for the collection in question and loads
// all images from that array in to the scene.

// export function loadSaveCollection(scene, collectionName, JSON) {
//   // Get the correct tileset
//   const tileset = JSON.tilesets.find(
//     (tileset) => tileset.name === collectionName
//   );

//   if (!tileset) {
//     console.error(
//       `loadSaveCollection.js cannot find "${collectionName}" tileset`
//     );
//   }

//   // Save the collection to the global registry
//   scene.registry.set(collectionName, tileset);

//   // Load each image in the tileset to scene
//   // with the filename as the key
//   tileset.tiles.map((tile) => {
//     const key = tile.image.split("/").pop().split(".")[0];
//     const url = tile.image;
//     scene.load.image(key, url);
//   });
// }

// // getCollectionReference
// // ----------------------------
// // Returns the key of the image stored by loadSaveCollection()
// // so it can be used in the scene.

// export function getCollectionReference(scene, collectionName, gid) {
//   // Get the collection from the registry
//   const collection = scene.registry.get(collectionName);
//   // Figure out what the ID is
//   const targetId = gid - collection.firstgid;
//   // Get the correct tile object.
//   const imgObj = collection.tiles.find((tile, i) => tile.id === targetId);
//   // Return the key, which is the filename.
//   return imgObj.image.split("/").pop().split(".")[0];
// }

// checkVisibleMedia() {

//   this.gameData.media.forEach((item) => {
//     let itemRect = new Phaser.Geom.Rectangle(
//       item.position[0],
//       item.position[1],
//       item.size[0],
//       item.size[1]
//     );

//     if (
//       Phaser.Geom.Intersects.RectangleToRectangle(itemRect, this.visibleRect)
//     ) {
//       if (!this.textures.exists(item.path) && !this.loading.has(item.path)) {
//         this.loading.add(item.path);

//         this.load.image(item.path, `/assets/media/${item.path}`);
//         this.load.once("complete", () => {

//           this.loading.delete(item.path);
//           this.add.image(item.position[0], item.position[1], item.path);

//         });
//         this.load.once("loaderror", () => {

//           this.loading.delete(item.path);
//           console.error("Failed to load image:", item.path);

//         });
//         this.load.start();
//       }
//     } else {
//       this.removeImageIfNotVisible(item);
//     }
//   });
// }

// removeImageIfNotVisible(item) {

//   this.children.list.forEach((child) => {
//     if (child.texture.key === item.path) {
//       let childRect = new Phaser.Geom.Rectangle(
//         child.x - child.displayWidth * child.originX,
//         child.y - child.displayHeight * child.originY,
//         child.displayWidth,
//         child.displayHeight
//       );
//       if (
//         !Phaser.Geom.Intersects.RectangleToRectangle(
//           childRect,
//           this.visibleRect
//         )
//       ) {
//         child.destroy();
//       }
//     }
//   });

// }
