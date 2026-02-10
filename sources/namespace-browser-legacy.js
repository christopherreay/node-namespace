if (self.atApplication === undefined || self.atAplication === null) self.atApplication = {};

let util = 
    { "inspect":
        (params) =>
        { try
          { let toReturn = JSON.stringify(params)
            return toReturn;
          }
          catch (error)
          {
            return error.toString();
          }

        }
    };


 atApplication.namespace =
      (object, address, createOnSearch) =>
      { if (createOnSearch === undefined) createOnSearch = true;
        if (!createOnSearch && !object)
        { return atApplication.namespace.NotFound;
        }
        if (!address) address = "";
        let current = object;
        let addressList = address.split(".");
        for (var addressItem of addressList)
        { if (! current.hasOwnProperty(addressItem))
          { if (! createOnSearch) return atApplication.namespace.NotFound;
            current[addressItem] = {};
          }
          current = current[addressItem];
        }
        return current;
      };
atApplication.ls = function
      (listOfStuff)
      {
        let argumentList = Array.from(arguments);

        // var useConsole;
        // if (arguments[0].constructor == require("console").Console )
        // { useConsole = argumentList.shift();
        // }
        // else
        // { useConsole = console;
        // }

        for (thing of argumentList)
        { console.log(thing);
        }
      }
atApplication.getTimestampNanos =
() =>
{ return  (
            ( BigInt
              ( Math.round
                (
                  ( performance.now() - atApplication.getTimestampNanos.startTime.relative)
                  * 100000
                )
              ) + atApplication.getTimestampNanos.startTime.absolute
            ).toString().padStart(40,"0")
          );
}
atApplication.namespace(atApplication.getTimestampNanos, "startTime").absolute = BigInt(Date.now())         * 1000000n;
atApplication.namespace(atApplication.getTimestampNanos, "startTime").relative = performance.now();


atApplication.test            = {};
atApplication.test.namespace  = atApplication.namespace;
{

        let atRoot = atApplication.test;

        atRoot.isObject           = (item) => { return item === Object(item) };
        atRoot.isObject_notArray  = (item) => { return atRoot.isObject(item) && !Array.isArray(item); }
        atRoot.isArray            = (item) => { return Array.isArray(item) }
        atRoot.isString           = (item) => { return Object.prototype.toString.call(item) === "[object String]" };
        atRoot.isFunction         = (item) => { return item && {}.toString.call(item) === '[object Function]' };
    
        atRoot.ls     = atApplication.ls;


        atRoot.regex = {};
        atRoot.regex.startsWithToReturn = /^\s*toReturn\s*=/;
      //namespace functions are convenience. Since @ makes namespaces mean anything and everything, its nice to be able to create and use them easily.
      atRoot.namespace = function(object, address, defaultList, checkExists)
      { //can use namespace to return constants too
        if (object === undefined || object === null || ! atRoot.isObject(object) )
        { let errorMessage = "@: ERROR: atSrc: namespace: object : this Object is not a valid namespace root object";
          atRoot.ls (errorMessage, { "object": object, "address": address} )
          throw new Error(errorMessage);
        }

        if (address === null) return object;
        if (address === undefined || !atRoot.isString(address) )
        { let errorMessage = "@: ERROR: atSrc: namespace: address : this address is not a valid address string";
          atRoot.ls(errorMessage, { "object": object, "address": address} )
          throw new Error(errorMessage+": "+address);
        }


        if (checkExists == null) checkExists = false;

        var current   = object;
        var last      = null;

        var addressList           = address.split(".");
        var addressListTestIndex  = addressList.length -1;
        var addressCounter        = 0;

        // by default just fill the namespace with objects
        if (defaultList == null) defaultList = ["toReturn = {}"];
        var defaultListTestIndex  = defaultList.length -1;
        var defaultCounter        = 0;

        // if the address is more than one item long, and the defaultList is one item long, populate the default list with empty objects, up until
        //   the leaf address
        var nonLeafNodes;
        var leafObject;
        if ( defaultList[0].startsWith("nonLeafNodes:") )
        { nonLeafNodes = defaultList[0].replace(/nonLeafNodes:/, "");
          //####console.log("nonLeafNodes: \n  ", nonLeafNodes);
        }
        else if ( defaultList[0].startsWith("leafNode:") )
        { defaultList[0] = defaultList[0].replace(/leafNode:/, "");
          if (defaultList[0].length == 0)
          { defaultList[0]  = "null";
            leafObject      = checkExists;
            checkExists     = false;
          }
          nonLeafNodes = "toReturn = {}";
        }


        for (var wayPoint of addressList)
        { //if (wayPoint === "") throw new Error("@: atSrc: namespace: setValue: key component cannot have zero length: "+address);
          if (!current.hasOwnProperty(wayPoint) )
          { if (! checkExists == false) return atRoot.namespace.NotFound;

            var toReturn;
            var toEval;
            if (addressCounter < addressListTestIndex && nonLeafNodes != null)
            { toEval = nonLeafNodes;
            }
            else
            { toEval = defaultList[defaultCounter];
            }
            if (! atRoot.regex.startsWithToReturn.test(toEval) ) toEval = "toReturn = "+toEval+";";
            //####console.log("toEval:", toEval);
            eval(toEval);
            // toReturn.name = wayPoint;
            current[wayPoint] =  toReturn;
            //####console.log("current:", current, "key:", wayPoint, "obj:", current[wayPoint]);
          }
          last    = current;
          current = current[wayPoint];

          addressCounter ++;
          if (defaultCounter < defaultListTestIndex)
          { defaultCounter ++;
          }
        }
        if (leafObject != null && current == null)
        { current = last[wayPoint] = leafObject;
        }


        if (checkExists == "delete") delete last[wayPoint];
        return current;
      }
      // NOTE: do not set this to false, it will cause horrible problems.
      //   the test of namespace.NotFound needs to be a function, not a user coded if
      atRoot.namespace.NotFound = {"namespaceFunctionConstant": "NotFound"};
      Object.freeze(atRoot.namespace.NotFound);
      atRoot.namespace.isNotFound = function(value, address)
      {
        // return JSON.stringify(value) === JSON.stringify(atRoot.namespace.NotFound);
        if (address !== undefined)
        { value = atRoot.namespace.getIfExists(value, address);
        }
        return atRoot.isObject_notArray(value) && value.namespaceFunctionConstant === "NotFound";
      }
      atRoot.namespace.traverse = function(traveller)
      {
        let object  = traveller.object;
        let address = traveller.address;

        if (object === undefined || object === null || ! atRoot.isObject(object) )
        { let errorMessage = "@: ERROR: atSrc: namespace: getIfExists: object : this Object is not a valid namespace root object";
          atRoot.ls (errorMessage, { "object": object, "address": address} )
          throw new Error(errorMessage);
        }

        if (address === null)
        { traveller.toReturn = object;
          return;
        }
        if (address === undefined || ( !atRoot.isString(address) && isNaN(address) ) )
        { let errorMessage = "@: ERROR: atSrc: namespace: getIfExists: address : this address is not a valid address string";
          atRoot.ls(errorMessage, { "object": object, "address": address} )
          throw new Error(errorMessage+": "+address);
        }
        else if (! isNaN(address) )
        { address = address.toString();
        }

        if (traveller.debugging === true) debugger;

        traveller.addressList = address.split(".");

        traveller.returnNow   = false;
        delete traveller.toReturn;

        traveller.current = traveller.object;
        traveller.addressListLength = traveller.addressList.length;
        traveller.index = -1;
        for ( traveller.addressComponent of traveller.addressList )
        { traveller.index ++;
          try
          { traveller.next = traveller.current[traveller.addressComponent];
          }
          catch (error)
          { traveller.next = undefined;
          }
          traveller.finalAddressComponent = traveller.index >= traveller.addressListLength -1;
          traveller.func(traveller);
          if (traveller.returnNow === true) return traveller.toReturn;
          traveller.current = traveller.next;
        }
        throw new Error("@: ERROR: atSrc: namespace: traverse: loop terminated without returning - this should never happen");
      }
      atRoot.namespace.getIfExists_callback = function(object, address, found, notFound)
      { let toReturn = atRoot.namespace.getIfExists(object, address);

        if      (! atRoot.namespace.isNotFound(toReturn) && isFunction(found)   )
        { return found(toReturn);
        }
        else if (  atRoot.namespace.isNotFound(toReturn) && isFunction(notFound))
        { return notFound(toReturn);
        }
        return toReturn;
      }
      atRoot.namespace.getIfExists = function(object, address, traveller)
      {
        if (traveller === undefined || traveller === null) traveller = {};

        // traveller.errorFunction = (error) => { "command": "getIfExists", "object": util.inspect(object).slice(200), address};

        if (traveller.debugging === true) debugger;

        traveller.object  =   object;
        traveller.address =   address;
        traveller.func    =
          ( (traveller) =>
            {
              if (traveller.next                   === undefined || traveller.next === atRoot.namespace.NotFound)
              { traveller.returnNow = true;
                if (traveller.defaultValueToReturn !== undefined)
                { traveller.toReturn = traveller.defaultValueToReturn
                }
                else
                { traveller.toReturn  = atRoot.namespace.NotFound;
                }
              }
              else if (traveller.finalAddressComponent  === true      )
              { traveller.returnNow = true;
                traveller.toReturn  = traveller.next;
              }
            }
          );
        atRoot.namespace.traverse(traveller);
        return traveller.toReturn;
      }
      
      atRoot.namespace.getMustExist = function(object, address, options)
      { const toReturn = atRoot.namespace.getIfExists(object, address);

        if (toReturn === atRoot.namespace.NotFound) { 
          let debuggingOutput = options.errorMessage || `{"propertyNotFound": {"address": ${util.inspect(address).slice(0,500)}, "object": ${util.inspect(object).slice(0, 2000)} } }`;        
          //atRoot.ls("@: ERROR: namespace.getMustExist: ",  debuggingOutput);
          throw new Error("@: namespace.getMustExist: "+debuggingOutput);
        }
        return toReturn;
      }
      atRoot.namespace.getMustExistRM = function(object, address)
      { try
        { atRoot.namespace.getMustExist(object, address);
        } 
        catch (error)
        { throw error;
        }
        return atRoot.namespace.rm(object, address);
      }
      atRoot.namespace.destructureMustExist = function(object, destructureDefinition, options)
      {
        let toReturn = {}
        for (let [key, value] of Object.entries(destructureDefinition))
        {
          atRoot.namespace.setValue(toReturn, key, atRoot.namespace.getMustExist(object, value, options));
        }
        return toReturn;
      }


      atRoot.namespace.leafNode = function(object, address, leafNode)
      { let toReturn;
        let traveller;

        traveller = { "overwrite": false};

        try
        { toReturn = atRoot.namespace.setValue(object, address, leafNode, traveller);
        }
        catch (error)
        { if (error.message.startsWith("@: atSrc: namespace: setValue: cannot overwrite existing value:"))
          { toReturn = traveller.next;
          }
        }
        return toReturn;

        // return atRoot.namespace(object, address, ["leafNode:"], leafNode);
      }
      atRoot.namespace.setValue = function(object, address, value, traveller)
      {
        if (traveller === undefined || traveller === null) traveller = {};


        if (traveller.debugging === true) debugger;


        if (address === null) throw new Error("@: atSrc: namespace: setValue: setting the address to null implies setting the containing object, which is impossible: "+address);

        traveller.object            =   object;
        traveller.address           =   address;
        traveller.setValue          =   value;

        traveller.overwrite         =   traveller.overwrite === true;
        traveller.dryRun            =   traveller.dryRun    === true;
        traveller.ignoreErrors      =   traveller.ignoreErrors === true;

        traveller.func              =
            (traveller) =>
            {
              if (traveller.debugging === true) debugger;

              if (! traveller.finalAddressComponent)
              { if (traveller.next === undefined)
                { if (traveller.dryRun === true)
                  { traveller.returnNow = true;
                  }
                  else
                  { traveller.next = traveller.current[traveller.addressComponent] = {};
                  }
                }
                else if (! atRoot.isObject(traveller.next) )
                { if (traveller.ignoreErrors === true)
                  { traveller.returnNow = true;
                    traveller.toReturn  = undefined;
                  }
                  else if (traveller.hardWriteHierarchy === true)
                  { traveller.next = traveller.current[traveller.addressComponent] = {};
                  }
                  else
                  { throw new Error("@: atSrc: namespace: setValue: there is no valid object hierarchy to "+traveller.address);
                  }
                }
              }
              else
              { if (traveller.overwrite !== true && traveller.ignoreErrors !== true && traveller.next !== undefined)
                { throw new Error("@: atSrc: namespace: setValue: cannot overwrite existing value: "+traveller.address);
                }
                else if (traveller.dryRun || ( traveller.overwrite === false && traveller.ignoreErrors === true && traveller.next !== undefined)  )
                { traveller.returnNow               = true;
                }
                else
                { 
                  if (atRoot.isFunction(traveller.setValue))
                  { //TODO: finish this
                  }

                  traveller.current[traveller.addressComponent] = traveller.setValue;
                  traveller.returnNow               = true;
                  traveller.toReturn                = traveller.setValue;
                }
              }
            }
        return atRoot.namespace.traverse(traveller);
      }

      atRoot.namespace.extend = function(extendIntoThisObject, extendFromThisObject, traveller)
      {
        // extend will throw an error without making any changes if there are any issues
        //   not thread safe
        if (traveller === undefined || traveller === null) traveller = {};
        if (traveller.debugging === true) debugger;

        if (atRoot.isObject_notArray(extendFromThisObject))
        { traveller.overwrite =   traveller.overwrite === true;
          traveller.ignoreErrors = traveller.ignoreErrors === true;
          // do a dry run, and throw an error if there are any
          if (traveller.ignoreErrors === false)
          { for ( const [key, value] of Object.entries(extendFromThisObject) )
            { traveller.dryRun = true;
              atRoot.namespace.setValue(extendIntoThisObject, key, value, traveller);
            }
          }
          // actually perform the xtend, as a batch transaction - not thread safe
          for ( const [key, value] of Object.entries(extendFromThisObject) )
          { traveller.dryRun = false;
            atRoot.namespace.setValue(extendIntoThisObject, key, value, traveller );
          }
        }
      }

      atRoot.namespace.flatten = function(objectToFlatten, currentNamespace, toReturn)
      {
        if (toReturn === undefined) toReturn = {};

        if (atRoot.isObject(objectToFlatten))
        {
          for (let [namespaceItem, recurseIntoThisObject] of Object.entries(objectToFlatten))
          { 
            let targetNamespace;
            if (currentNamespace === undefined) 
            { targetNamespace = namespaceItem;
            }
            else
            { targetNamespace = currentNamespace+"."+namespaceItem;
            }
            atRoot.namespace.flatten(recurseIntoThisObject, targetNamespace, toReturn);
          }
        }
        else
        {
          if (currentNamespace === undefined)
          { return objectToFlatten;
          }
          else 
          { toReturn[currentNamespace] = objectToFlatten;
          }
        }
        return toReturn;
      }

      atRoot.namespace.freezeEverything = function(object, options, recurseRoot)
      {
        if (options && options.except && options.except.includes(object) )
        {
          return;
        }

        for ( key of Object.getOwnPropertyNames(object) )
        {
          // atRoot.ls("@: freeze: key"+ key);
          if (atRoot.isObject(object[key]))
          {
            atRoot.namespace.freezeEverything(object[key], options, false);

          }
        }
        if (recurseRoot !== false) Object.freeze(object);

        return object;
      }
      atRoot.namespace.extendObjectWithVennComplementOfTwo = function(object, vennData, optionsDict)
      { 
        vennData.inOneNotTwo.map
            ( (namespaceString) => 
              { 
                namespace.leafNode(object, namespaceString, namespace.getMustExist(vennData.complementOfTwo, namespaceString));
                //namespace.setValue(object, namespaceString, namespace.getMustExist(vennData.complementOfTwo, namespaceString), optionsDict) 
              }
            );
      }
      atRoot.namespace.buildStateFromDeepCopy = function(persistentDataAndVennData)
      { 
                
                  let persistableStateToAssign  = JSON.parse(JSON.stringify(persistentDataAndVennData.travellerState_persistable));
                  let runtimeStateToAssign      = {};
                  if (persistentDataAndVennData.vennData !== undefined)
                  { runtimeStateToAssign = persistentDataAndVennData.vennData.complementOfTwo;
                  }
                  
                  let fullStateToAssign = {};
                  namespace.extendObjectWithVennComplementOfTwo(fullStateToAssign, undoTravellerToThisState.vennData, {"overwrite":true});
                  namespace.extend(fullStateToAssign, persistableStateToAssign, {"ignoreErrors":true});
                  
                  workerTraveller.state.traveller = fullStateToAssign.traveller;
                  // workerTraveller.sta
      }
      atRoot.namespace.deepCopyTraveller = function(copyThisTraveller)
      { 
        debugger;

        let travellerState_original     = { "traveller": namespace.getMustExist(copyThisTraveller, "traveller") };
        let travellerState_persistable  = { "traveller": JSON.parse(JSON.stringify(copyThisTraveller.traveller)) };
        let vennData                    = atRoot.namespace.venn(travellerState_original, travellerState_persistable);

        debugger;

        return { "travellerState_persistable": travellerState_persistable , "vennData": vennData };
      };

      atRoot.namespace.equals = function(object1, object2, fullAddress, toReturn)
      { if (object1 === object2) return true;

        try
        { if (! atRoot.isObject(object1)) return false;
          
          let object2KeyList = [];
          if (atRoot.isObject(object2)) 
          { object2KeyList = Array.from(Object.keys(object2));
          } 
          else 
          { return false;
          }

          for (const [key, value] of Object.entries(object1) )
          {
            if (! key in object2) return false;

            let childrenEqual = atRoot.namespace.equals(value, object2[key]); 
            if (childrenEqual !== true) return false;
            let keyIndex = object2KeyList.indexOf(key);
            //atRoot.ls({"key": key, "keyIndex": keyIndex, "object2KeyList": object2KeyList});
            if (keyIndex !== -1) object2KeyList.splice(keyIndex, 1);
            //debugger;
            //atRoot.ls(object2KeyList);
          }
          
          if (object2KeyList.length > 0) return false;
        }
        catch (error)
        { 
          atRoot.ls(error);
          return false;
        }

        return true;
      }

      atRoot.namespace.venn = function(object1, object2, fullAddress, toReturn)
      {
        if (! atRoot.isObject(object1) )
        { throw new Error ("@: atSrc: namespace.venn: object1 parameter contains a primitive, not an object");
        }

        if (! fullAddress) fullAddress  = null;
        let fullAddressPrefix = "";
        if (fullAddress !== null) fullAddressPrefix = fullAddress +".";
        if (! toReturn)    toReturn     = {"inOneNotTwo": [], "inTwoNotOne": [], "complementOfOne": {}, "complementOfTwo": {}};

        let object2KeyList = null;
        if (atRoot.isObject(object2)) object2KeyList = Object.keys(object2);
        
        for (const [key, value] of Object.entries(object1) )
        {
          let recurseNewFullAddress = fullAddressPrefix+key; 
          if ( ! atRoot.isObject(object2) || ! key in object2 || atRoot.isFunction(value) )
          { toReturn.inOneNotTwo.push(recurseNewFullAddress);
            toReturn.changed = true;
            namespace.setValue(toReturn.complementOfTwo, recurseNewFullAddress, value) 
//////////////////////// CONTINUE ///////////////////
            continue
          }
          else
          { object2KeyList.splice(object2KeyList.indexOf(key), 1);
          }


          if (atRoot.isObject(value) )
          { 
            atRoot.namespace.venn(value, object2[key], recurseNewFullAddress, toReturn);
          }
          else
          {
          }


        }
        if (object2KeyList !== null && object2KeyList.length > 0)
        { 
          toReturn.inTwoNotOne.push
          (...( object2KeyList.map
                ( (keyNotFoundInOne) => 
                  { let fullAddressInTwo =  fullAddressPrefix+keyNotFoundInOne;
                    namespace.setValue(toReturn.complementOfOne, fullAddressInTwo, object2[keyNotFoundInOne]);
                    toReturn.changed = true;
                    return fullAddressInTwo;
                  }
                )
          )   );
        }

        if (fullAddress === null) if (toReturn.changed !== true) toReturn = undefined;

        return toReturn; 
      }
      atRoot.namespace.deepCopy = function(copyThisObject, fullDottedAddressString, runtimeNamespaceList) //, objectToReturn)
      {
        if ( ! atRoot.isObject(copyThisObject) )  // is a primitive?)
        { 
          // objectToReturn = copyThisObject;
          return copyThisObject;
        }
        
        if ( fullDottedAddressString === undefined || fullDottedAddressString === null)
        { fullDottedAddressString = "";
          
        }
        
        if (runtimeNamespaceList === undefined || runtimeNamespaceList === null)
        {
          runtimeNamespaceList = atRoot.namespace.getIfExists(copyThisObject, "traveller.routerAsAService.nestTravellerFlow.runtimeNamespaceList");
          if (atRoot.namespace.isNotFound(runtimeNamespaceList)) runtimeNamespaceList = [];
        }

        //if (objectToReturn === undefined || objectToReturn === null)
        let objectToReturn = {};
        if (atRoot.isArray(copyThisObject)) objectToReturn = [];

        for (let [key, value] of Object.entries(copyThisObject) )
        { if ( runtimeNamespaceList.contains(fullDottedAddressString + dotKey))
          {
            objectToReturn[key] = value;
          }
          else
          { objectToReturn[key] = atRoot.namespace.deepCopy(value, fullDottedAddressString+"."+key, runtimeNamespaceList) 
          }
        }
        
        return objectToReturn;
      }

      atRoot.namespace.toEval_localVars_store = function(objectName, address, localVarNameList, localVarNameDict)
      {
        if (address === null)
        { addressString = "null";
        }
        else
        { addressString = "\""+address+"\"";
        }

        let evalList = [];
        if (Array.isArray(localVarNameList))
        { for (let localVarName of localVarNameList)
          { evalList.push
            ( "namespace("+objectName+", "+addressString+")."+localVarName+" = "+localVarName+";"
            );
          }
        }
        if (atRoot.isObject_notArray(localVarNameDict) )
        { for (let localVarName in localVarNameDict)
          { evalList.push
            ( "namespace("+objectName+", "+addressString+")."+localVarNameDict[localVarName]+" = "+localVarName+";"
            );
          }
        }
        return evalList.join("\n");
      };
      atRoot.namespace.toEval_localVars_load = function(objectName, address, localVarNameList, localVarNameDict)
      {
        if (address === null)
        { addressString = "null";
        }
        else
        { addressString = "\""+address+"\"";
        }

        let evalList = [];
        if (Array.isArray(localVarNameList))
        { for (let localVarName of localVarNameList)
          { evalList.push
            ( "namespace("+objectName+", "+addressString+")."+localVarName+" = "+localVarName+";"
            );
          }
        }
        if (atRoot.isObject_notArray(localVarNameDict) )
        { for (let localVarName in localVarNameDict)
          { evalList.push
            ( "namespace("+objectName+", "+addressString+")."+localVarNameDict[localVarName]+" = "+localVarName+";"
            );
          }
        }
        return evalList.join("\n");
      };
      atRoot.namespace.move = function(object, moveDict)
      { //extend this to use dot notation for addresses. And maybe a target object
        for (var key in moveDict)
        { object[moveDict[key]] = object[key]
          delete object[key];
        }
      }
      atRoot.namespace.cp = function(source, target, cpList)
      { cpList.forEach
        ( (key) =>
          { target[key] = source[key];
          }
        );
      }
      atRoot.namespace.rm = function(object, address)
      { return atRoot.namespace(object, address, null, "delete");
      }
      atRoot.namespace.contains = function(object, address, listOfKeys)
      { var checkThisObject = atRoot.namespace.getIfExists(object, address);
        if (atRoot.namespace.isNotFound(checkThisObject)) return false;

        if (Array.isArray(checkThisObject))
        { for (var i=0,len=listOfKeys.length; i<len; i++)
          { if (checkThisObject.indexOf(listOfKeys[i]) == -1)
              return false;
          }
        }
        else
        { for (var i=0,len=listOfKeys.length; i<len; i++)
          { if (! checkThisObject.hasOwnProperty(listOfKeys[i]))
              return false;
          }
        }


        return true;
      }

      atRoot.namespaceExists = function(object, address)
      { var current = object;
        address = address.split(".");

        for (var wayPoint of address)
        { if (! current.hasOwnProperty(wayPoint) )
          { return false;
          }
          current = current[wayPoint];
        }
        return true;
      }


      atRoot.namespace.joinDot = function(...toJoin)
      { return atRoot.namespace.joinWordList_helper(".", ...toJoin);
      }
      atRoot.namespace.joinNamespaceDots = atRoot.namespace.joinDots;

      atRoot.namespace.joinSlash = function(...toJoin)
      { return atRoot.namespace.joinWordList_helper("/", ...toJoin);
      }
      atRoot.namespace.joinNamespaceSlash = atRoot.namespace.joinSlash;

      atRoot.namespace.joinWordList_helper = function(separator, ...toJoin)
      {
        if (! atRoot.isString(separator) )  throw new Error("@: atSrc: namespace.joinWordList_helper: separator must be a string");

        let fullAddressList = [];
        for (let item of toJoin)
        { if    (atRoot.isArray(item)) fullAddressList.push(...item);
          else  fullAddressList.push(...item.split(separator));
        }
        return fullAddressList.join(separator);
      }
        atRoot.namespace.compareSlice = function(namespaceToCheck, compareTo, sliceParams, options)
        {
          debugger;
          try
          {
            let splitRegex = ".";
            // if (options.dotOrSlash === true) splitRegex = /[\.\/]/g;

            if (atRoot.isString(namespaceToCheck)) namespaceToCheck  = namespaceToCheck.split(".");
            if (atRoot.isString(compareTo)       ) compareTo         = compareTo.split(".");
            if (! atRoot.isArray(sliceParams)    ) sliceParams       = [sliceParams];

            // if (Math.abs(sliceParams) > namespaceToCheck.length || compareTo.length > namespaceToCheck.length)
            //   return false;

            let sliceToCheck     = namespaceToCheck.slice(...sliceParams);
            let sliceToCompare   = compareTo;//.slice(...sliceParams);

            for (let i=sliceToCheck.length-1; i>-1; i--)
            { if  (     sliceToCheck[i] !== sliceToCompare[i]
                    &&  sliceToCompare[i] !== "*"
                  ) return false;
            }
            return true;
          }
          catch (error)
          { return false;
          }
        };
      atRoot.namespace.tween =
          function (namespaceToTween)
          {
            if (! atRoot.isString(namespaceToTween))
            {
              return undefined;
            }
            return namespaceToTween.split(".").join(".children.")
          }
      atRoot.namespace.iterate = 
          function* (namespaceToIterate, tweenWith)
          {
            // debugger;

            if (! atRoot.isString(namespaceToIterate)) return null;
            if (! atRoot.isString(tweenWith)) tweenWith = "";
            else if (! tweenWith.endsWith(".")) tweenWith = tweenWith+".";

            let namespaceToIterateList = namespaceToIterate.split(".")
            let namespaceFragment = undefined;
            while (namespaceToIterateList.length > 0) 
            {
              let namespaceItem = namespaceToIterateList.shift();
              if (namespaceFragment === undefined)
              { namespaceFragment = namespaceItem;
              }
              else
              { namespaceFragment += "."+tweenWith+namespaceItem;
              }
              yield { "namespaceItem": namespaceItem, "namespaceFragment": namespaceFragment, "remainingNamespaceList": namespaceToIterateList}
            }
            return;
          }
      atRoot.namespace.iterateFragment = 
          function* (namespaceToIterate, tweenWith)
          {
            for (let toYield of atRoot.namespace.iterate(namespaceToIterate, tweenWith))
            {
              yield toYield["namespaceFragment"]
            }
            return;
          }
      atRoot.namespace.iterateItem = 
          function* (namespaceToIterate)
          {
            for (let toYield of atRoot.namespace.iterate(namespaceToIterate, tweenWith))
            {
              yield toYield["namespaceItem"]
            }
            return;
          }
      atRoot.namespace.isRootOf =
          function (rootNamespace, targetNamespace)
          {
            let removeTargetNamespace = targetNamespace.replace(rootNamespace, "");
            return removeTargetNamespace === "" || removeTargetNamespace.startsWith(".");
          }

}


atApplication.namespace = atApplication.test.namespace;
atApplication.ls        = atApplication.ls;


atApplication.isObject          = (item) => { return item === Object(item) };
atApplication.isObject_notArray = (item) => { return isObject(item) && !Array.isArray(item); };
atApplication.isArray           = (item) => { return Array.isArray(item); };
atApplication.isString          = (item) => { return Object.prototype.toString.call(item) === "[object String]" };
atApplication.isFunction        = (item) => { return Object.prototype.toString.call(item) === '[object Function]'; };
atApplication.isInteger         = (item) => { return Number.isInteger(item) };
atApplication.noop              = () => {};

atApplication.namespace.setValue(atApplication, "regexCollection.urlWithProtocol_regex", /^http[s]?:i\/\//);

atApplication.namespace.setValue
    ( atApplication, "functionCollection.concatBaseURL",
      function (baseURL, targetURL)
      {
        let prependToURL = baseURL;
        let separator = "";
        if ( atApplication.regexCollection.urlWithProtocol_regex.test(targetURL) === true ) 
        {
          prependToURL = "";
        }
        else if ( prependToURL === "" )
        {
          // do nothing
        }
        else if ( !prependToURL.endsWith("/") && !targetURL.startsWith("/") )
        {
          prependToURL = prependToURL+"/"  
        }
        return prependToURL+targetURL;
      }
    );



atApplication.toEval_installAtApplicationFunctionsInLocalNamespace = 
    `   var AT = atApplication;

        var namespace         = AT.namespace;
        var ls                = AT.ls;

        var isObject          = AT.isObject;
        var isObject_notArray = AT.isObject_notArray;
        var isArray           = AT.isArray;
        var isString          = AT.isString;
        var isFunction        = AT.isFunction;
        var isInteger         = AT.isInteger;
    `;