//     wink-nlp
//
//     Copyright (C) GRAYPE Systems Private Limited
//
//     This file is part of “wink-nlp”.
//
//     Permission is hereby granted, free of charge, to any
//     person obtaining a copy of this software and
//     associated documentation files (the "Software"), to
//     deal in the Software without restriction, including
//     without limitation the rights to use, copy, modify,
//     merge, publish, distribute, sublicense, and/or sell
//     copies of the Software, and to permit persons to
//     whom the Software is furnished to do so, subject to
//     the following conditions:
//
//     The above copyright notice and this permission notice
//     shall be included in all copies or substantial
//     portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//     ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//     TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//     PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//     DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
//     CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
//     CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

//

/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */

var containedEntities = require( './contained-entities.js' );

// ### Helper Functions

// Get **item at** collection, selection & parent.
var getParentItem = require( './api/get-parent-item.js' );
var colGetItemAt = require( './api/col-get-item.js' );
var selGetItemAt = require( './api/sel-get-item.js' );

// **Each** iterator for collection & selection.
var colEach = require( './api/col-each.js' );
var selEach = require( './api/sel-each.js' );

var colMap = require( './api/col-map.js' );
var selMap = require( './api/sel-map.js' );

// **Filter** for collection & selection.
var colFilter = require( './api/col-filter.js' );
var selFilter = require( './api/sel-filter.js' );

// **Token's out** for item, collection & selection.
var itmTokenOut = require( './api/itm-token-out.js' );
var colTokensOut = require( './api/col-tokens-out.js' );
var selTokensOut = require( './api/sel-tokens-out.js' );

// **Entity's out** for item, collection & selection.
var itmEntityOut = require( './api/itm-entity-out.js' );
var colEntitiesOut = require( './api/col-entities-out.js' );
var selEntitiesOut = require( './api/sel-entities-out.js' );

// **Sentence's out** for item, collection & selection.
var itmSentenceOut = require( './api/itm-sentence-out.js' );
var colSentencesOut = require( './api/col-sentences-out.js' );

// **Document's out** for item.
var itmDocumentOut = require( './api/itm-document-out.js' );

// Print tokens, it is primarily for command line output.
var printTokens = require( './api/print-tokens.js' );

var its = require( './its.js' );

// <hr/>

// # Doc
/**
 *
 * The wink-nlp **doc**ument – constructed in `wink-nlp.js` – publishes the
 * developer APIs.
 *
 * @param  {object} docData     It encapsulates the document data.
 * @param  {object} addons      The model's addon, may contain word vectors, stemmer etc.
 * @return {object}             conatining APIs.
 * @private
 */
var doc = function ( docData, addons ) {
  // Extract `cache` as it is frequently accessed.
  var cache = docData.cache;

  // Document's tokens; each token is represented as an array of numbers:
  // ```
  // [
  //   hash, // of tokenized lexeme
  //   (nox) + preceding spaces, // expansion's normal
  //   pos + lemma, // pos & lemma are contextual
  //   entity + sentence // 12bit + 20bits
  // ]
  // ```
  var tokens = docData.tokens;

  // Entities — sorted as array of `[ start, end, entity type ].`
  var entities = docData.entities;
  var customEntities = docData.customEntities;

  // Sentences — sorted as array of pairs of `[ start, end ]` pointing to the `tokens`.
  var sentences = docData.sentences;

  // Markings are 4-tuples of `start`, `end` **token indexes**,  and `begin & end markers`.
  // The begin & end markers are used to markup the tokens specified.
  var markings = docData.markings;


  // #### API core functions:

  // Collection APIs.
  var colEntities;
  var colCustomEntities;
  var colTokens;
  var colSentences;

  // Selection — obtained via `filter` — APIs. It is also like a collection.
  var colSelectedEntities;
  var colSelectedCustomEntities;
  var colSelectedTokens;

  // Item APIs.
  var itemToken;
  var itemEntity;
  var itemCustomEntity;
  var itemSentence;

  // Vectors API
  var contextualVectors;

  // Others.
  var isLexeme = cache.lookup;

  // The Document — Returned!
  var methods = Object.create( null );

  // ## Token
  // **Item, Collection, and Selection APIs.**

  // ### itemToken
  /**
   *
   * Makes item of the token specified at `index`.
   *
   * @param  {number} index The index of the token, which is required to be returned as item token.
   * @return {object}       containing applicable API methods.
   * @private
   */
  itemToken = function ( index ) {
    var api = Object.create( null );
    // Access the parent document.
    api.parentDocument = () => methods;
    // Access the parent entity, **if any.**
    api.parentEntity = () => getParentItem( index, entities, itemEntity );
    // Access the parent cuustom entity, **if any.**
    api.parentCustomEntity = () => getParentItem( index, customEntities, itemCustomEntity );
    // Markup this token.
    api.markup = ( beginMarker, endMarker ) => markings.push( [ index, index, beginMarker, endMarker ] );
    // Output this token or its properties using mapper function — `f`.
    api.out = ( f ) => itmTokenOut( index, docData, f, addons );
    // Access the parent sentence.
    api.parentSentence = () => getParentItem( index, sentences, itemSentence );
    // Index within the document.
    api.index = () => ( index );
    return api;
  }; // itemToken()

  // ### colSelectedTokens
  /**
   *
   * Makes collection of tokens identified by the `selectedTokens` array.
   *
   * @param  {array} selectedTokens The array of selected tokens, using which the
   *                                collection is made.
   * @return {object}               containing applicable API methods.
   * @private
   */
  colSelectedTokens = function ( selectedTokens ) {
    var api = Object.create( null );
    // Iterator.
    api.each = ( f ) => selEach( f, selectedTokens, itemToken );
    // Map.
    api.map = ( f ) => selMap( f, selectedTokens, itemToken );
    // Filter.
    api.filter = ( f ) => selFilter( f, selectedTokens, itemToken, colSelectedTokens );
    // Item at `k`th index. If `k` is outside valid range, return `undefined` like JS.
    api.itemAt = ( k ) => selGetItemAt( k, selectedTokens, itemToken );
    // Number of selected tokens.
    api.length = () => ( selectedTokens.length );
    // Output this collection of selected tokens as a reduced values or properties
    // using map/reduce functions — `f/g`.
    api.out = ( f, g ) => selTokensOut( selectedTokens, docData, f, g, addons );
    return api;
  }; // colTokens()

  // ### colTokens
  /**
   *
   * Makes collection of tokens beginning from `start` index to `end` index.
   *
   * @param  {number} start The start index.
   * @param  {number} end   The end index.
   * @return {object}       containing applicable API methods.
   * @private
   */
  colTokens = function ( start, end ) {
    return (
      function () {
        var api = Object.create( null );
        // Iterator.
        api.each = ( f ) => colEach( f, start, end, itemToken );
        // Map.
        api.map = ( f ) => colMap( f, start, end, itemToken );
        // Filter.
        api.filter = ( f ) => colFilter( f, start, end, itemToken, colSelectedTokens );
        // Item at `k`th index. If `k` is outside valid range, return `undefined` like JS.
        // No need to handle relative indexing as `colGetItemAt` handles it.
        api.itemAt = ( k ) => colGetItemAt( k, start, end, itemToken );
        // Length of this collection.
        api.length = () => ( end - start + 1 );
        // Output this token collection as a reduced values or properties using
        // map/reduce functions — `f/g`.
        api.out = ( f, g ) => colTokensOut( start, end, docData, f, g, addons );

        return api;
      }
    );
  }; // colTokens()

  // <hr/>

  // ## Entity
  // **Item, Collection, and Selection APIs.**

  // ### itemEntity
  /**
   *
   * Makes item of the entity specified at `index`.
   *
   * @param  {number} index The index of the entity, which is required to be
   *                        returned as item entity.
   * @return {object}       containing applicable API methods.
   * @private
   */
  itemEntity = function ( index ) {
    var api = Object.create( null );
    // Access the parent document.
    api.parentDocument = () => methods;
    // Markup this entity.
    api.markup = ( beginMarker, endMarker ) => markings.push( [ entities[ index ][ 0 ], entities[ index ][ 1 ], beginMarker, endMarker ] );
    // Output this entity or its properties using mapper function — `f`.
    api.out = ( f ) => itmEntityOut( index, entities, docData, f );
    // Access the parent sentence.
    api.parentSentence =  () => getParentItem( entities[ index ][ 0 ], sentences, itemSentence );
    // Retun collection of tokens contained in this entity.
    api.tokens = colTokens( entities[ index ][ 0 ], entities[ index ][ 1 ] );
    // Index within the document.
    api.index = () => ( index );
    return api;
  }; // itemEntity()

  // ### colSelectedEntities
  /**
   *
   * Makes collection of entities identified by the `selectedEntities` array.
   *
   * @param  {array} selectedEntities The array of selected entities, using which
   *                                  the collection is made.
   * @return {object}                 containing applicable API methods.
   * @private
   */
  colSelectedEntities = function ( selectedEntities ) {
    var api = Object.create( null );
    // Iterator.
    api.each = ( f ) => selEach( f, selectedEntities, itemEntity );
    // Map.
    api.map = ( f ) => selMap( f, selectedEntities, itemEntity );
    // Filter.
    api.filter = ( f ) => selFilter( f, selectedEntities, itemEntity, colSelectedEntities );
    // Item at `k`th index. If `k` is outside valid range, return `undefined` like JS.
    api.itemAt = ( k ) => selGetItemAt( k, selectedEntities, itemEntity );
    // Number of selected entities.
    api.length = () => ( selectedEntities.length );
    // Output this collectionn of selected of entities as a reduced value
    // using map/reduce functions — `f/g`.
    api.out = ( f, g ) => selEntitiesOut( selectedEntities, entities, docData, f, g );
    return api;
  }; // colSelectedEntities()

  // ### colEntities
  /**
   *
   * Makes collection of all the entities.
   *
   * @return {object} containing applicable API methods.
   * @private
   */
  colEntities = function () {
    var api = Object.create( null );
    // Iterator.
    api.each = ( f ) => colEach( f, 0, entities.length - 1, itemEntity );
    // Map.
    api.map = ( f ) => colMap( f, 0, entities.length - 1, itemEntity );
    // Filter.
    api.filter = ( f ) => colFilter( f, 0, entities.length - 1, itemEntity, colSelectedEntities );
    // Item at `k`th index. If `k` is outside valid range, return `undefined` like JS.
    api.itemAt = ( k ) => colGetItemAt( k, 0, ( entities.length - 1 ), itemEntity );
    // Length of this collection.
    api.length = () => ( entities.length );
    // Output this collection of entities as a reduced value
    // using map/reduce functions — `f/g`.
    api.out = ( f, g ) => colEntitiesOut( entities, docData, f, g );
    return api;
  }; // colEntities()

  // <hr/>

  // ## Entity
  // **Item, Collection, and Selection APIs.**

  // ### itemCustomEntity
  /**
   *
   * Makes item of the entity specified at `index`.
   *
   * @param  {number} index The index of the entity, which is required to be
   *                        returned as item entity.
   * @return {object}       containing applicable API methods.
   * @private
   */
  itemCustomEntity = function ( index ) {
    var api = Object.create( null );
    // Access the parent document.
    api.parentDocument = () => methods;
    // Markup this entity.
    api.markup = ( beginMarker, endMarker ) => markings.push( [ customEntities[ index ][ 0 ], customEntities[ index ][ 1 ], beginMarker, endMarker ] );
    // Output this entity or its properties using mapper function — `f`.
    api.out = ( f ) => itmEntityOut( index, customEntities, docData, f );
    // Access the parent sentence.
    api.parentSentence =  () => getParentItem( customEntities[ index ][ 0 ], sentences, itemSentence );
    // Retun collection of tokens contained in this entity.
    api.tokens = colTokens( customEntities[ index ][ 0 ], customEntities[ index ][ 1 ] );
    // Index within the document.
    api.index = () => ( index );
    return api;
  }; // itemCustomEntity()

  // ### colSelectedCustomEntities
  /**
   *
   * Makes collection of entities identified by the `selectedEntities` array.
   *
   * @param  {array} selectedCustomEntities The array of selected entities, using which
   *                                        the collection is made.
   * @return {object}                       containing applicable API methods.
   * @private
   */
  colSelectedCustomEntities = function ( selectedCustomEntities ) {
    var api = Object.create( null );
    // Iterator.
    api.each = ( f ) => selEach( f, selectedCustomEntities, itemCustomEntity );
    // Map.
    api.map = ( f ) => selMap( f, selectedCustomEntities, itemCustomEntity );
    // Filter.
    api.filter = ( f ) => selFilter( f, selectedCustomEntities, itemCustomEntity, colSelectedCustomEntities );
    // Item at `k`th index. If `k` is outside valid range, return `undefined` like JS.
    api.itemAt = ( k ) => selGetItemAt( k, selectedCustomEntities, itemCustomEntity );
    // Number of selected entities.
    api.length = () => ( selectedCustomEntities.length );
    // Output this collectionn of selected of entities as a reduced value
    // using map/reduce functions — `f/g`.
    api.out = ( f, g ) => selEntitiesOut( selectedCustomEntities, customEntities, docData, f, g );
    return api;
  }; // colSelectedCustomEntities()

  // ### colCustomEntities
  /**
   *
   * Makes collection of all the entities.
   *
   * @return {object} containing applicable API methods.
   * @private
   */
  colCustomEntities = function () {
    var api = Object.create( null );
    // Iterator.
    api.each = ( f ) => colEach( f, 0, customEntities.length - 1, itemCustomEntity );
    // Map.
    api.map = ( f ) => colMap( f, 0, customEntities.length - 1, itemCustomEntity );
    // Filter.
    api.filter = ( f ) => colFilter( f, 0, customEntities.length - 1, itemCustomEntity, colSelectedCustomEntities );
    // Item at `k`th index. If `k` is outside valid range, return `undefined` like JS.
    api.itemAt = ( k ) => colGetItemAt( k, 0, ( customEntities.length - 1 ), itemCustomEntity );
    // Length of this collection.
    api.length = () => ( customEntities.length );
    // Output this collection of entities as a reduced value
    // using map/reduce functions — `f/g`.
    api.out = ( f, g ) => colEntitiesOut( customEntities, docData, f, g );
    return api;
  }; // colCustomEntities()

  // <hr/>

  // ## Sentence
  // **Item, Collection, and Selection APIs.**

  // ### itemSentence
  /**
   *
   * Makes item of the sentence specified by `index` of the sentence.
   *
   * @param  {number} index The index of the sentence.
   * @return {object}       containing applicable API methods.
   * @private
   */
  itemSentence = function ( index ) {
    var api = Object.create( null );
    // Access the parent document.
    api.parentDocument = () => methods;
    // Markup this sentence.
    api.markup = ( beginMarker, endMarker ) => markings.push( [ sentences[ index ][ 0 ], sentences[ index ][ 1 ], beginMarker, endMarker ] );
    // Output this sentence as text.
    api.out = ( f ) => itmSentenceOut( index, docData, f, addons );
    // Outputs the collection of entities, if any, contained in this sentence.
    api.entities = () => colSelectedEntities( containedEntities( entities, sentences[ index ][ 0 ], sentences[ index ][ 1 ] ) );
    // Outputs the collection of custom entities, if any, contained in this sentence.
    api.customEntities = () => colSelectedCustomEntities( containedEntities( customEntities, sentences[ index ][ 0 ], sentences[ index ][ 1 ] ) );
    // Outputs the collection of tokens in this sentence.
    api.tokens = colTokens( sentences[ index ][ 0 ], sentences[ index ][ 1 ] );
    // Index within the document.
    api.index = () => ( index );
    return api;
  }; // itemSentence()

  // ### colSentences
  /**
   *
   * Makes collection of sentences in this document.
   *
   * @return {object} containing applicable API methods.
   * @private
   */
  colSentences = function () {
    var api = Object.create( null );
    // Iterator.
    api.each = ( f ) => colEach( f, 0, sentences.length - 1, itemSentence );
    // Map.
    api.map = ( f ) => colMap( f, 0, sentences.length - 1, itemSentence );
    // Item at `k`th index. If `k` is outside valid range, return `undefined` like JS.
    api.itemAt = ( k ) => colGetItemAt( k, 0, ( sentences.length - 1 ), itemSentence );
    // Length of this collection.
    api.length = () => ( sentences.length );
    // Output this collection of sentences as an array of strings.
    api.out = ( f ) => colSentencesOut( docData, f, addons );
    return api;
  }; // colSentences()

  // <hr/>

  // ### contextualVectors
  /**
   *
   * Makes a JSON of contextually relevant words in the winkNLP format.
   *
   * @return {string} containing the JSON.
  */
  // eslint-disable-next-line complexity
  contextualVectors = function ( { lemma = true, specificWordVectors = [], similarWordVectors = false, wordVectorsLimit = 0 } = {} ) {
    // Error handling!
    if ( docData.wordVectors === null )
      throw Error( 'wink-nlp: word vectors are not loaded: load them winkNLP\'s instantiation time.' );
    if ( !Array.isArray( specificWordVectors ) )
      throw Error( `wink-nlp: expecting a valid Javascript array for similarWordVectos, instead found "${typeof specificWordVectors}".`);
    if ( !Number.isInteger( wordVectorsLimit ) || wordVectorsLimit >= docData.wordVectors.size )
      throw Error( 'wink-nlp: invalid value or type encountered for wordVectorsLimit.' );
    if ( lemma && !docData.currPipe.pos )
      throw Error( 'wink-nlp: Can\'t create lemma vectors without pos: add a "pos" to NLP pipe.' );
    // Initialize contextual vectors.
    const cv = Object.create( null );
    // Following properties are constants, therefore can be directly copied.
    cv.precision = docData.wordVectors.precision;
    cv.l2NormIndex = docData.wordVectors.l2NormIndex;
    cv.wordIndex = docData.wordVectors.wordIndex;
    cv.dimensions = docData.wordVectors.dimensions;
    cv.unkVector = docData.wordVectors.unkVector.slice( 0 );
    // Following properties will be determined on the basis of the context.
    cv.size = 0;
    cv.words = [];
    cv.vectors = Object.create( null );
    // Shortcut all word vectors.
    const awvs = docData.wordVectors.vectors;

    // Extract all document's tokens.
    const docTokens = colTokens( 0, docData.numOfTokens - 1 )()
                      .out()
                      .map( ( t ) => t.toLowerCase() );
    let docTokensLemma = [];
    if ( lemma ) docTokensLemma = colTokens( 0, docData.numOfTokens - 1 )()
                                           .out( its.lemma )
                                           .map( ( t ) => t.toLowerCase() );

    // NOTE: For UNK words an all zero vector is set up, with `l2Norm = 0`, which may be used in as.vector helper
    // to detect an UNK word.
    for ( let i = 0; i < docTokens.length; i += 1 ) cv.vectors[ docTokens[ i ] ] = ( awvs[ docTokens[ i ] ] || cv.unkVector ).slice( 0 );
    for ( let i = 0; i < docTokensLemma.length; i += 1 ) cv.vectors[ docTokensLemma[ i ] ] = ( awvs[ docTokensLemma[ i ] ] || cv.unkVector ).slice( 0 );
    for ( let i = 0; i < specificWordVectors.length; i += 1 ) {
      const spWord = ( specificWordVectors[ i ] ) ? specificWordVectors[ i ].toString().trim() : false;
      if ( spWord )
        cv.vectors[ specificWordVectors[ i ] ] = ( awvs[ specificWordVectors[ i ] ] || cv.unkVector ).slice( 0 );
    }

    if ( similarWordVectors ) {
      // Extract similar words on the basis of shortest Manhattan distance.
      const allUniqueTokens = Object.keys( cv.vectors );
      // Set up similar words array, with the size of all unique tokens.
      const similarWords = new Array( allUniqueTokens.length );
      // Placeholder for maintaining the similarity score based on Manhattan distance.
      const similarWordsScore = new Array( allUniqueTokens.length );
      // Initialize to a large distance!
      similarWordsScore.fill( 1000000 );

      // Initialize contextual vectors size i.e. vocab.
      cv.size = allUniqueTokens.length;

      // Now search each one of them in the entire word vectors space.
      // Keep updating the smallest distance.
      for ( let i = 0; i < allUniqueTokens.length; i += 1 ) {
        const cwv = cv.vectors[ allUniqueTokens[ i ] ];

        for ( const word in awvs ) { // eslint-disable-line guard-for-in
          if ( word === allUniqueTokens[ i ] ) continue; // eslint-disable-line no-continue
          const wv = awvs[ word ];
          let distance = 0;

          for ( let k = 0; k < cv.dimensions && distance < similarWordsScore[ i ]; k += 1 ) {
            distance += Math.abs( cwv[ k ] - wv[ k ] );
          } // Mahattan distance computation loop.

          if ( distance < similarWordsScore[ i ] ) {
            similarWordsScore[ i ] = distance;
            similarWords[ i ] = word;
          }
        } // Traversing all the word vectors.
      } // Traversing all the tokens in the corpus.

      // Update contextual vectors using the list of similar words; also update their size.
      for ( let i = 0; i < similarWords.length; i += 1 ) {
        if ( cv.vectors[ similarWords[ i ] ] === undefined ) {
          // Similar word must exist in `awvs`.
          cv.vectors[ similarWords[ i ] ] = awvs[ similarWords[ i ] ].slice( 0 );
          cv.size += 1;
        }
      }

    } else cv.size = Object.keys( cv.vectors ).length;

    // Fill the balance space, if any, on the basis of wordVectorsLimit.
    for ( let i = 0; cv.size < wordVectorsLimit; i += 1 ) {
      const word = docData.wordVectors.words[ i ];
      if ( !cv.vectors[ word ] ) {
        cv.vectors[ word ] = awvs[ word ].slice( 0 );
        cv.size += 1;
      }
    }

    // Sort words on the basis of their usage frequency.
    cv.words = Object.keys( cv.vectors )
                        .map( ( w ) => ( { w: w, i: (cv.vectors[ w ][ cv.wordIndex ] < 0 ) ? Infinity : cv.vectors[ w ][ cv.wordIndex ] } ) )
                        .sort( (a, b) => a.i - b.i )
                        .map( ( o ) => o.w );

    // Update the word index entry inside every vector.
    for ( let i = 0; i < cv.size; i += 1 ) cv.vectors[ cv.words[ i ] ][ cv.wordIndex ] = i;

    return JSON.stringify( cv );
  }; // contextualVectors()

  // Published chainable methods.
  methods.entities = colEntities;
  methods.customEntities = colCustomEntities;
  methods.isLexeme = isLexeme;
  methods.isOOV = cache.isOOV;
  methods.out = ( f ) => itmDocumentOut( docData, f, addons );
  methods.sentences = colSentences;
  methods.tokens = colTokens( 0, docData.numOfTokens - 1 );

  methods.printTokens = () => printTokens( tokens, cache );

  // Enusre that we make a deep copy of config before returning to avoid corruption!
  methods.pipeConfig = () => JSON.parse( JSON.stringify( docData.currPipe ) );

  methods.contextualVectors = contextualVectors;

  return methods;
};

module.exports = doc;
