(function ( w, d, PKAE ) {
    'use strict';


    var StringUtils = {
        readUTF16String: function(bytes, bigEndian, maxBytes) {
            var ix = 0;
            var offset1 = 1, offset2 = 0;
            maxBytes = Math.min(maxBytes||bytes.length, bytes.length);

            if( bytes[0] == 0xFE && bytes[1] == 0xFF ) {
                bigEndian = true;
                ix = 2;
            } else if( bytes[0] == 0xFF && bytes[1] == 0xFE ) {
                bigEndian = false;
                ix = 2;
            }
            if( bigEndian ) {
                offset1 = 0;
                offset2 = 1;
            }

            var arr = [];
            for( var j = 0; ix < maxBytes; j++ ) {
                var byte1 = bytes[ix+offset1];
                var byte2 = bytes[ix+offset2];
                var word1 = (byte1<<8)+byte2;
                ix += 2;
                if( word1 == 0x0000 ) {
                    break;
                } else if( byte1 < 0xD8 || byte1 >= 0xE0 ) {
                    arr[j] = String.fromCharCode(word1);
                } else {
                    var byte3 = bytes[ix+offset1];
                    var byte4 = bytes[ix+offset2];
                    var word2 = (byte3<<8)+byte4;
                    ix += 2;
                    arr[j] = String.fromCharCode(word1, word2);
                }
            }
            var string = new String(arr.join(""));
            string.bytesReadCount = ix;
            return string;
        },
        readUTF8String: function(bytes, maxBytes) {
            var ix = 0;
            maxBytes = Math.min(maxBytes||bytes.length, bytes.length);

            if( bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF ) {
                ix = 3;
            }

            var arr = [];
            for( var j = 0; ix < maxBytes; j++ ) {
                var byte1 = bytes[ix++];
                if( byte1 == 0x00 ) {
                    break;
                } else if( byte1 < 0x80 ) {
                    arr[j] = String.fromCharCode(byte1);
                } else if( byte1 >= 0xC2 && byte1 < 0xE0 ) {
                    var byte2 = bytes[ix++];
                    arr[j] = String.fromCharCode(((byte1&0x1F)<<6) + (byte2&0x3F));
                } else if( byte1 >= 0xE0 && byte1 < 0xF0 ) {
                    var byte2 = bytes[ix++];
                    var byte3 = bytes[ix++];
                    arr[j] = String.fromCharCode(((byte1&0xFF)<<12) + ((byte2&0x3F)<<6) + (byte3&0x3F));
                } else if( byte1 >= 0xF0 && byte1 < 0xF5) {
                    var byte2 = bytes[ix++];
                    var byte3 = bytes[ix++];
                    var byte4 = bytes[ix++];
                    var codepoint = ((byte1&0x07)<<18) + ((byte2&0x3F)<<12)+ ((byte3&0x3F)<<6) + (byte4&0x3F) - 0x10000;
                    arr[j] = String.fromCharCode(
                        (codepoint>>10) + 0xD800,
                        (codepoint&0x3FF) + 0xDC00
                    );
                }
            }
            var string = new String(arr.join(""));
            string.bytesReadCount = ix;
            return string;
        },
        readNullTerminatedString: function(bytes, maxBytes) {
            var arr = [];
            maxBytes = maxBytes || bytes.length;
            for ( var i = 0; i < maxBytes; ) {
                var byte1 = bytes[i++];
                if( byte1 == 0x00 ) break;
                arr[i-1] = String.fromCharCode(byte1);
            }       
            var string = new String(arr.join(""));
            string.bytesReadCount = i;
            return string;
        }
    };

    var getBytesAt = function(data, iOffset, iLength) {
        if (iOffset < 0 || iLength < 0 || iOffset + iLength > data.byteLength) return [];
        var bytes = new Array(iLength);
        for( var i = 0; i < iLength; i++ ) {
            bytes[i] = data.getUint8(iOffset+i);
        }
        return bytes;
    };
    var getStringWithCharsetAt = function(data, iOffset, iLength, iCharset) {
        var bytes = getBytesAt(data, iOffset, iLength);
        var sString;

        switch( (iCharset || '').toString().toLowerCase() ) {
            case 'utf-16':
            case 'utf-16le':
            case 'utf-16be':
                sString = StringUtils.readUTF16String(bytes, iCharset);
                break;

            case 'utf-8':
                sString = StringUtils.readUTF8String(bytes);
                break;

            default:
                sString = StringUtils.readNullTerminatedString(bytes);
                break;
        }

        return sString;
    };

    var ID3v2 = {
        readFrameData: {}
    };

    var getStringAt = function(data, iOffset, iLength) {
        if (iOffset < 0 || iLength < 0 || iOffset + iLength > data.byteLength) return '';
        var aStr = [];
        for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
            aStr[j] = String.fromCharCode(data.getUint8(i));
        }
        return aStr.join("");
    };
    var getLongAt = function(data, iOffset, bBigEndian) {
        var iByte1 = data.getUint8(iOffset),
            iByte2 = data.getUint8(iOffset + 1),
            iByte3 = data.getUint8(iOffset + 2),
            iByte4 = data.getUint8(iOffset + 3);

        var iLong = bBigEndian ?
            (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
            : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
        if (iLong < 0) iLong += 4294967296;
        return iLong;
    };
    var getShortAt = function(data, iOffset, bBigEndian) {
        var iShort = bBigEndian ?
            (data.getUint8(iOffset) << 8) + data.getUint8(iOffset + 1)
            : (data.getUint8(iOffset + 1) << 8) + data.getUint8(iOffset);
        if (iShort < 0) iShort += 65536;
        return iShort;
    };
    var getInteger24At = function(data, iOffset, bBigEndian) {
        var iByte1 = data.getUint8(iOffset),
            iByte2 = data.getUint8(iOffset + 1),
            iByte3 = data.getUint8(iOffset + 2);

        var iInteger = bBigEndian ?
            ((((iByte1 << 8) + iByte2) << 8) + iByte3)
            : ((((iByte3 << 8) + iByte2) << 8) + iByte1);
        if (iInteger < 0) iInteger += 16777216;
        return iInteger;
    };
    var isBitSetAt = function ( dataview, offset, bit ) {
        var ibyte = dataview.getUint8(offset);
        return (ibyte & (1 << bit)) != 0;
    };
    var readSynchsafeInteger32At = function (offset, data) {
        var size1 = data.getUint8(offset);
        var size2 = data.getUint8(offset+1);
        var size3 = data.getUint8(offset+2);
        var size4 = data.getUint8(offset+3);
        // 0x7f = 0b01111111
        var size = size4 & 0x7f
                 | ((size3 & 0x7f) << 7)
                 | ((size2 & 0x7f) << 14)
                 | ((size1 & 0x7f) << 21);

        return size;
    };
    var readFrameFlags = function(data, offset) {
        return {
            format: {
                unsynchronisation: isBitSetAt(data, offset+1, 1),
                data_length_indicator: isBitSetAt(data, offset+1, 0)
            }
        };
    };
    var _shortcuts = {
        "title"     : ["TIT2", "TT2"],
        "artist"    : ["TPE1", "TP1"],
        "album"     : ["TALB", "TAL"],
        "year"      : ["TDRC", "TYER", "TYE"],
        "comment"   : ["COMM", "COM"],
        "track"     : ["TRCK", "TRK"],
        "genre"     : ["TCON", "TCO"],
        "picture"   : ["APIC", "PIC"],
        "lyrics"    : ["USLT", "ULT"]
    };
    var _defaultShortcuts = ["title", "artist", "album", "year", "comment", "track", "genre", "picture", "lyrics"];

    var getTagsFromShortcuts = function(shortcuts) {
        var tags = [];
        for( var i = 0, shortcut; shortcut = shortcuts[i]; i++ ) {
            tags = tags.concat(_shortcuts[shortcut]||[shortcut]);
        }
        return tags;
    };
    var getFrameData = function( frames, ids ) {
        if( typeof ids == 'string' ) { ids = [ids]; }

        for( var i = 0, id; id = ids[i]; i++ ) {
            if( id in frames ) { return frames[id]; }
        }
    };
    var readFrames = function (offset, end, data, id3header, tags) {
            var frames = {};
            var major = id3header["major"];

            tags = getTagsFromShortcuts(tags || _defaultShortcuts);

            end = Math.min(end, data.byteLength);
            while( offset < end ) {
                var readFrameFunc = null;
                var frameData = data;
                var frameDataOffset = offset;
                var flags = null;

                switch( major ) {
                    case 2:
                    if (frameDataOffset + 6 > end) return frames;
                    var frameID = getStringAt(frameData, frameDataOffset, 3);
                    var frameSize = getInteger24At(frameData, frameDataOffset+3, true);
                    var frameHeaderSize = 6;
                    break;

                    case 3:
                    if (frameDataOffset + 10 > end) return frames;
                    var frameID = getStringAt(frameData, frameDataOffset, 4);
                    var frameSize = getLongAt(frameData, frameDataOffset+4, true);
                    var frameHeaderSize = 10;
                    break;

                    case 4:
                    if (frameDataOffset + 10 > end) return frames;
                    var frameID = getStringAt(frameData, frameDataOffset, 4);
                    var frameSize = readSynchsafeInteger32At(frameDataOffset+4, frameData);
                    var frameHeaderSize = 10;
                    break;
                }
                // if last frame GTFO
                if( frameID == "" ) { break; }
                if( !frameSize || frameDataOffset + frameHeaderSize + frameSize > end ) { break; }

                // advance data offset to the next frame data
                offset += frameHeaderSize + frameSize;
                // skip unwanted tags
                if( tags.indexOf( frameID ) < 0 ) { continue; }

                // read frame message and format flags
                if( major > 2 )
                {
                    flags = readFrameFlags(frameData, frameDataOffset+8);
                }

                frameDataOffset += frameHeaderSize;

                // the first 4 bytes are the real data size
                // (after unsynchronisation && encryption)
                if( flags && flags.format.data_length_indicator )
                {
                    frameDataOffset += 4;
                    frameSize -= 4;
                }

                // TODO: support unsynchronisation
                if( flags && flags.format.unsynchronisation )
                {
                    //frameData = removeUnsynchronisation(frameData, frameSize);
                    continue;
                }

                // find frame parsing function

                if( frameID in ID3v2.readFrameData ) {
                    readFrameFunc = ID3v2.readFrameData[frameID];
                } else if( frameID[0] == "T" ) {
                    readFrameFunc = ID3v2.readFrameData["T*"];
                }

                var parsedData = readFrameFunc ? readFrameFunc(frameDataOffset, frameSize, frameData, flags) : undefined;
                if( !(frameID in frames) ) {
                    frames[frameID] = parsedData;
                }
            }

            return frames;
    };

    function getTextEncoding( bite ) {
        var charset;
        switch( bite )
        {
            case 0x00:
                charset = 'iso-8859-1';
                break;

            case 0x01:
                charset = 'utf-16';
                break;

            case 0x02:
                charset = 'utf-16be';
                break;

            case 0x03:
                charset = 'utf-8';
                break;
        }

        return charset;
    }

    ID3v2.readFrameData['APIC'] = function readPictureFrame(offset, length, data, flags, v) {
        v = v || '3';

        var start = offset;
        var charset = getTextEncoding( data.getUint8(offset) );
        switch( v ) {
            case '2':
                var format = getStringAt(data, offset+1, 3);
                offset += 4;
                break;

            case '3':
            case '4':
                var format = getStringWithCharsetAt(data, offset+1, length - (offset-start), '');
                offset += 1 + format.bytesReadCount;
                break;
        }
        var bite = data.getUint8(offset, 1);
        var desc = getStringWithCharsetAt(data, offset+1, length - (offset-start), charset);

        offset += 1 + desc.bytesReadCount;

        return {
            "format" : format.toString(),
            "type" : bite,
            "description" : desc.toString(),
            "data" : getBytesAt(data, offset, (start+length) - offset)
        };
    };

    ID3v2.readFrameData['COMM'] = function readCommentsFrame(offset, length, data) {
        var start = offset;
        var charset = getTextEncoding( data.getUint8(offset) );
        var language = getStringAt(data, offset+1, 3 );
        var shortdesc = getStringWithCharsetAt(data, offset+4, length-4, charset);

        offset += 4 + shortdesc.bytesReadCount;
        var text = getStringWithCharsetAt(data, offset, (start+length) - offset, charset );

        return {
            language : language,
            short_description : shortdesc.toString(),
            text : text.toString()
        };
    };

    ID3v2.readFrameData['COM'] = ID3v2.readFrameData['COMM'];

    ID3v2.readFrameData['PIC'] = function(offset, length, data, flags) {
        return ID3v2.readFrameData['APIC'](offset, length, data, flags, '2');
    };

    ID3v2.readFrameData['T*'] = function readTextFrame(offset, length, data) {
        var charset = getTextEncoding( data.getUint8(offset) );

        return getStringWithCharsetAt(data, offset+1, length-1, charset).toString();
    };

    ID3v2.readFrameData['TCON'] = function readGenreFrame(offset, length, data) {
        var text = ID3v2.readFrameData['T*'].apply( this, arguments );
        return text.replace(/^\(\d+\)/, '');
    };

    ID3v2.readFrameData['TCO'] = ID3v2.readFrameData['TCON'];

    ID3v2.readFrameData['USLT'] = function readLyricsFrame(offset, length, data) {
        var start = offset;
        var charset = getTextEncoding( data.getUint8(offset) );
        var language = getStringAt(data, offset+1, 3 );
        var descriptor = getStringWithCharsetAt(data, offset+4, length-4, charset );

        offset += 4 + descriptor.bytesReadCount;
        var lyrics = getStringWithCharsetAt(data, offset, (start+length) - offset, charset );

        return {
            language : language,
            descriptor : descriptor.toString(),
            lyrics : lyrics.toString()
        };
    };

    ID3v2.readFrameData['ULT'] = ID3v2.readFrameData['USLT'];


    ID3v2.ReadTags = function ( arraybuffer ) {
        if (!arraybuffer || arraybuffer.byteLength < 10) return null;
        var data = new DataView ( arraybuffer );
        var offset = 0;


        if (getStringAt(data, 0, 3) !== 'ID3') return null;
        var major = data.getUint8(offset+3);
        if( major < 2 || major > 4 ) { return null; }
        var unsynch = isBitSetAt(data, offset+5, 7);
        var xheader = isBitSetAt(data, offset+5, 6);
        var size = readSynchsafeInteger32At(offset+6, data);
        var end = offset + 10 + size;
        if (end > data.byteLength) return null;
        offset += 10;

        if( xheader ) {
            if (offset + 4 > end) return null;
            var xheadersize = data.getInt32( offset, true ); //data.getLongAt(offset, true);
            // The 'Extended header size', currently 6 or 10 bytes, excludes itself.
            offset += xheadersize + 4;
            if (offset > end) return null;
        }

        var id3 = {};

        var frames = unsynch ? {} : readFrames(offset, end, data, { major: major });
        // create shortcuts for most common data
        for( var name in _shortcuts ) if(_shortcuts.hasOwnProperty(name)) {
            var data = getFrameData( frames, _shortcuts[name] );
            if( data ) id3[name] = data;
        }

        return id3;
    };

    var _s = function (s) {
        for (var a = [], i = 0; i < s.length; ++i) a[i] = s.charCodeAt(i) & 255;
        return a;
    };
    var _n = function (n) {
        return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    };
    var _ss = function (n) {
        return [(n >>> 21) & 127, (n >>> 14) & 127, (n >>> 7) & 127, n & 127];
    };
    var _u = function (s, bom) {
        s = (s || '').toString();
        for (var a = bom ? [255, 254] : [], i = 0, c; i < s.length; ++i) {
            c = s.charCodeAt(i); a.push(c & 255, c >> 8);
        }
        return a;
    };
    var _v = function (v, k) {
        return (v && v[k] !== undefined) ? v[k] : (v || '');
    };
    var _f = function (id, b) {
        return b && b.length ? _s(id).concat(_n(b.length), [0, 0], b) : [];
    };
    var _at = function (ab) {
        var b = new Uint8Array(ab);
        if (b.length < 10 || b[0] != 73 || b[1] != 68 || b[2] != 51) return 0;
        var n = 10 + ((b[6] & 127) << 21 | (b[7] & 127) << 14 | (b[8] & 127) << 7 | (b[9] & 127)) + ((b[5] & 16) ? 10 : 0);
        return n > b.length ? 0 : n;
    };
    var _apic = function (p) {
        if (!p || !p.data || !p.data.length) return [];
        var d = p.data, a = [0].concat(_s(p.format || 'image/jpeg'), [0, p.type || 3, 0]);
        for (var i = 0; i < d.length; ++i) a.push(d[i]);
        return a;
    };
    var _txt = function (s) {
        s = (s || '').toString();
        return s ? [1].concat(_u(s, 1)) : [];
    };

    ID3v2.WriteTags = function (ab, tag) {
        var fr = [], p = tag.picture;
        fr = fr.concat(
            _f('TIT2', _txt(tag.title)),
            _f('TPE1', _txt(tag.artist)),
            _f('TALB', _txt(tag.album)),
            _f('TYER', _txt(tag.year)),
            _f('TCON', _txt(tag.genre)),
            _f('TRCK', _txt(tag.track)),
            _f('COMM', _v(tag.comment, 'text') ? [1].concat(_s('eng'), _u('', 1), [0, 0], _u(_v(tag.comment, 'text'), 1)) : []),
            _f('USLT', _v(tag.lyrics, 'lyrics') ? [1].concat(_s('eng'), _u('', 1), [0, 0], _u(_v(tag.lyrics, 'lyrics'), 1)) : []),
            _f('APIC', _apic(p))
        );
        var hd = _s('ID3').concat([3, 0, 0], _ss(fr.length));
        var au = new Uint8Array(ab, _at(ab));
        var out = new Uint8Array(hd.length + fr.length + au.length), o = 0;
        out.set(hd, o); o += hd.length;
        out.set(fr, o); o += fr.length;
        out.set(au, o);
        return out.buffer;
    };

    w.ID3v2 = ID3v2;


    /// -------

    var ID4 = {};

    ID4.types = {
        '0'     : 'uint8',
        '1'     : 'text',
        '13'    : 'jpeg',
        '14'    : 'png',
        '21'    : 'uint8'
    };
    ID4.atom = {
        '©alb': ['album'],
        '©art': ['artist'],
        '©ART': ['artist'],
        'aART': ['artist'],
        '©day': ['year'],
        '©nam': ['title'],
        '©gen': ['genre'],
        'trkn': ['track'],
        'covr': ['picture'],
        '©lyr': ['lyrics'],
        '©cmt': ['comment']
    };

    ID4.ReadTags = function(arraybuffer) {
        if (!arraybuffer || arraybuffer.byteLength < 8) return null;
        var data = new DataView ( arraybuffer );
        var tag = {};
        readAtom(tag, data, 0, data.byteLength);
        return tag;
    };

    function readAtom(tag, data, offset, length, indent)
    {
        indent = indent === undefined ? "" : indent + "  ";
        var seek = offset;
        var end = Math.min(offset + length, data.byteLength);
        while (seek + 8 <= end)
        {
            var atomSize = data.getInt32(seek); // getLongAt(data, seek, true);
            if (atomSize == 0) return;
            if (atomSize < 8 || seek + atomSize > end) return;
            var atomName = getStringAt(data, seek + 4, 4);
            // Container atoms
            if (atomName === 'meta')
            {
                seek += 4; // next_item_id (uint32)
                readAtom(tag, data, seek + 8, atomSize - 8, indent);
                return; 
            }
            if (atomName === 'moov' || atomName === 'udta' || atomName === 'ilst' ) // ['moov', 'udta', 'meta', 'ilst'].indexOf(atomName) > -1)
            {
                readAtom(tag, data, seek + 8, atomSize - 8, indent);
                return;
            }

            /*
            if (['moov', 'udta', 'meta', 'ilst'].indexOf(atomName) > -1)
            {
                if (atomName === 'meta') seek += 4; // next_item_id (uint32)
                readAtom(tag, data, seek + 8, atomSize - 8, indent);
                return;
            }
            */

            // Value atoms
            if (ID4.atom[atomName])
            {
                if (seek + 24 > end) return;
                var klass = getInteger24At(data, seek + 16 + 1, true);
                var atom = ID4.atom[atomName];
                var type = ID4.types[klass];
                if (atomName === 'trkn')
                {
                    if (seek + 29 > end) return;
                    tag[atom[0]] = data.getUint8(seek + 16 + 11);
                    tag['count'] = data.getUint8(seek + 16 + 13);
                }
                else
                {
                    // 16: name + size + "data" + size (4 bytes each)
                    // 4: atom version (1 byte) + atom flags (3 bytes)
                    // 4: NULL (usually locale indicator)
                    var dataStart = seek + 16 + 4 + 4;
                    var dataEnd = atomSize - 16 - 4 - 4;
                    if (dataEnd < 0 || dataStart + dataEnd > end) return;
                    var atomData;
                    switch( type ) {
                        case 'text':
                            atomData = getStringWithCharsetAt(data, dataStart, dataEnd, "UTF-8");
                            break;

                        case 'uint8':
                            atomData = getShortAt(data, dataStart);
                            break;

                        case 'jpeg':
                        case 'png':
                            atomData = {
                                format  : "image/" + type,
                                data    : getBytesAt(data, dataStart, dataEnd)
                            };
                            break;
                    }

                    if (atom[0] === "comment") {
                        tag[atom[0]] = {
                            "text": atomData
                        };
                    } else {
                        tag[atom[0]] = atomData;
                    }
                }
            }
            seek += atomSize;
        }
    }

    w.ID4 = ID4;

})( window, document, PKAudioEditor );
