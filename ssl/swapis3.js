var fs = require("fs");
var settings = require("../../config/settings");
var aws = require("../../config/auth");
var sp = require("../core-common.js");
var uuid = require("node-uuid");
var AWS = require("aws-sdk");
var db = require("../../db/db-mssql");

const msal = require("@azure/msal-node");
const graph = require("@microsoft/microsoft-graph-client");
//var multer = require("multer");
const mysql = require("mysql");

const axios = require("axios");
const SQL = require("./snap_sql.js");
const MSSQL = SQL.MSSQL;
const MYSQL = SQL.MYSQL;
const NEO4J = SQL.NEO4J;
var S3 = new AWS.S3({
  signatureVersion: "v4",
  region: "us-east-1",
  accessKeyId: aws.awsuserAuth.s3secure.accessKeyId,
  secretAccessKey: aws.awsuserAuth.s3secure.secretAccessKey,
});
AWS.config.update({ region: "us-east-1" });

var S3FS = require("s3fs"),
  s3fsImpl = new S3FS(aws.awsuserAuth.s3secure.bucketName, {
    accessKeyId: aws.awsuserAuth.s3secure.accessKeyId,
    secretAccessKey: aws.awsuserAuth.s3secure.secretAccessKey,
    region: "us-east-1",
    ACL: "public-read",
  });
const mySqlOptions = {
  key: fs.readFileSync("/home/ec2-user/snapin/ssl/smartweb_key.pem"),
  cert: fs.readFileSync("/home/ec2-user/snapin/ssl/smartweb_crt.pem"),
  ca: fs.readFileSync("/home/ec2-user/snapin/ssl/DigiCertGlobalRootCA.crt.pem"),
};
settings.dbConfig.azure["ssl"] = {
  ca: mySqlOptions.ca,
  //cert: mySqlOptions.cert, // Path to the client certificate file
  //key: mySqlOptions.key, // Path to the client private key file,
  //secureProtocol: "TLSv1_2_method",
};

const ZEPCRM = {
  callApi: async function (EndPoint, Method, Parameters, contentType) {
    // console.log("Calling ZEPCRM API: ", EndPoint, Parameters, contentType);
    contentType = contentType ? contentType : "multipart/form-data; boundary";
    EndPoint = `https://zepcrm.com/api/${EndPoint}`;
    const requestBody = Parameters;
    let data = null;
    try {
      if (Method === "POST") {
        const response = await axios.post(EndPoint, requestBody);
        data = response.data;
        // console.log("API POST Results: ", data);
      } else {
        const response = await axios.get(EndPoint, requestBody, {
          headers: {
            "Content-Type": contentType,
          },
        });
        data = response.data;
        //  console.log("API GET Results: ", data);
      }
      return { err: null, data: data };
    } catch (error) {
      console.log(`Error API endpoint: ${EndPoint}`, error);
      return { err: error, data: null };
    }
  },
  callEndpoint: async function (EndPoint, Method, Parameters, contentType) {
    // console.log("Calling API EndPoint: ", EndPoint, Parameters, contentType);
    const API_KEY = "5btoa4x9-f541-92c2-y583-3q9lq1l8";
    contentType = contentType ? contentType : "multipart/form-data; boundary";
    EndPoint = `https://${EndPoint}`;
    const requestBody = Parameters;
    let data = null;
    //console.log("EndPoint:", API_KEY, contentType, requestBody);
    try {
      //axios.defaults.headers.common['Authorization'] = `Bearer ${API_KEY}`
      if (Method === "POST") {
        const response = await axios.post(EndPoint, requestBody, {
          headers: {
            Authorization: API_KEY,
            "x-api-key": API_KEY,
            "Content-Type": contentType,
          },
        });
        data = response.data;
        //console.log("API POST Results: ", data);
      } else {
        const response = await axios.get(EndPoint, {
          params: requestBody,
          headers: {
            Authorization: API_KEY,
            "x-api-key": API_KEY,
            "Content-Type": contentType,
          },
        });
        data = response.data;
        //console.log("API GET Results: ", data);
      }
      return { err: null, data: data };
    } catch (error) {
      console.log(`Error API endpoint: ${EndPoint}`, error);
      return { err: error, data: null };
    }
  },
  detectFileType: function (fileString) {
    const signatures = {
      "89504E47": "image/png",
      FFD8FFDB: "image/jpeg",
      25504446: "application/pdf",
      47494638: "image/gif", // GIF
      D0CF11E0A1B11AE1: "application/msword", // .doc
      "504B0304":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      // Add more signatures as needed
    };

    const firstChars = fileString.substring(0, 12); // Increase to 12 characters for .doc signature

    for (const signature in signatures) {
      if (firstChars.startsWith(signature)) {
        return signatures[signature];
      }
    }

    return null;
  },
};
var createFileName = function (fname, path) {
  var ext = fname.substring(fname.indexOf(".")),
    name = fname.replace(ext, ""),
    cpath = path ? path : "users/";

  name = cpath + name + "_" + uuid.v1().toString() + ext;
  name = name.replace(/ /g, "_");
  name = name.replace(/%20/g, "_");
  return name;
};
var pathFileName = function (fname, path) {
  var ext = fname.substring(fname.indexOf(".")),
    name = fname.replace(ext, ""),
    cpath = path ? path : "users/";

  name = cpath + name + ext;
  name = name.replace(/ /g, "_");
  name = name.replace(/%20/g, "_");
  return name;
};
var createFileNameNoExt = function (fname, path) {
  var ext = fname.substring(fname.indexOf(".")),
    name = fname.replace(ext, ""),
    cpath = path ? path : "users/";

  name = cpath + name + ext;
  name = name.replace(/ /g, "_");
  name = name.replace(/%20/g, "_");
  return name;
};
var S3root = "https://s3.amazonaws.com/smartweb-pro.com";
var S3only = "https://s3.amazonaws.com/";
var S3secure = "https://s3.amazonaws.com/secure.smartweb-pro.com";
var formatObject = function (dataarray) {
  /*
        Used to retrieve a table header/column set from a select statement with multiple rows
        ONLY used with default selectSQL results returns JSON results
        smart: {
            colcount    : number of columns
            size        : raw byte size 
            minsize     : compressed size
            rowcount    : number of rows
            columns     : array of column objects { index: name: length: type: prec: }
            records     : array of data rows
        }
    */

  var smart = {},
    columns = [],
    rows = [],
    metarows = null,
    row = [],
    col = {},
    c = 0,
    r = 0,
    record = {},
    datacolumns = dataarray[0];
  try {
    for (column in datacolumns) {
      c++;
      columns.push({
        index: c,
        name: column,
        length: datacolumns[column].length,
        type: typeof datacolumns[column],
      });
    }
  } catch (err) {
    throw new Error("Error in formatObject loading columns " + err);
  }
  try {
    smart.colcount = c + 1;
    smart.compress = false;
    smart.size = 0;
    smart.minsize = 0;
    smart.rowcount = dataarray.length;
    smart.columns = columns;
    for (r = 0; r < dataarray.length; r++) {
      record = dataarray[r];
      row = [];
      for (col in record) {
        if (record[col] === null) {
          record[col] = 0;
        }
        row.push(record[col]);
      }
      rows.push(row);
    }
    smart.type = "table";
    smart.records = rows;
    smart.size = rows.toString().length + smart.columns.toString().length;
    smart.minsize = smart.size;
  } catch (err) {
    throw new Error("Error in formatTable loading rows " + err);
  }
  return smart;
};
var getContentType = function (path, type) {
  var extTypes = {
    "3gp": "video/3gpp",
    a: "application/octet-stream",
    ai: "application/postscript",
    aif: "audio/x-aiff",
    aiff: "audio/x-aiff",
    asc: "application/pgp-signature",
    asf: "video/x-ms-asf",
    asm: "text/x-asm",
    asx: "video/x-ms-asf",
    atom: "application/atom+xml",
    au: "audio/basic",
    avi: "video/x-msvideo",
    bat: "application/x-msdownload",
    bin: "application/octet-stream",
    bmp: "image/bmp",
    bz2: "application/x-bzip2",
    c: "text/x-c",
    cab: "application/vnd.ms-cab-compressed",
    cc: "text/x-c",
    chm: "application/vnd.ms-htmlhelp",
    class: "application/octet-stream",
    com: "application/x-msdownload",
    conf: "text/plain",
    cpp: "text/x-c",
    crt: "application/x-x509-ca-cert",
    css: "text/css",
    csv: "text/csv",
    cxx: "text/x-c",
    deb: "application/x-debian-package",
    der: "application/x-x509-ca-cert",
    diff: "text/x-diff",
    djv: "image/vnd.djvu",
    djvu: "image/vnd.djvu",
    dll: "application/x-msdownload",
    dmg: "application/octet-stream",
    doc: "application/msword",
    dot: "application/msword",
    dtd: "application/xml-dtd",
    dvi: "application/x-dvi",
    ear: "application/java-archive",
    eml: "message/rfc822",
    eps: "application/postscript",
    exe: "application/x-msdownload",
    f: "text/x-fortran",
    f77: "text/x-fortran",
    f90: "text/x-fortran",
    flv: "video/x-flv",
    for: "text/x-fortran",
    gem: "application/octet-stream",
    gemspec: "text/x-script.ruby",
    gif: "image/gif",
    gz: "application/x-gzip",
    h: "text/x-c",
    hh: "text/x-c",
    htm: "text/html",
    html: "text/html",
    ico: "image/vnd.microsoft.icon",
    ics: "text/calendar",
    ifb: "text/calendar",
    iso: "application/octet-stream",
    jar: "application/java-archive",
    java: "text/x-java-source",
    jnlp: "application/x-java-jnlp-file",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "application/javascript",
    json: "application/json",
    log: "text/plain",
    m3u: "audio/x-mpegurl",
    m4v: "video/mp4",
    man: "text/troff",
    mathml: "application/mathml+xml",
    mbox: "application/mbox",
    mdoc: "text/troff",
    me: "text/troff",
    mid: "audio/midi",
    midi: "audio/midi",
    mime: "message/rfc822",
    mml: "application/mathml+xml",
    mng: "video/x-mng",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mp4v: "video/mp4",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    ms: "text/troff",
    msi: "application/x-msdownload",
    odp: "application/vnd.oasis.opendocument.presentation",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odt: "application/vnd.oasis.opendocument.text",
    ogg: "application/ogg",
    p: "text/x-pascal",
    pas: "text/x-pascal",
    pbm: "image/x-portable-bitmap",
    pdf: "application/pdf",
    pem: "application/x-x509-ca-cert",
    pgm: "image/x-portable-graymap",
    pgp: "application/pgp-encrypted",
    pkg: "application/octet-stream",
    pl: "text/x-script.perl",
    pm: "text/x-script.perl-module",
    png: "image/png",
    pnm: "image/x-portable-anymap",
    ppm: "image/x-portable-pixmap",
    pps: "application/vnd.ms-powerpoint",
    ppt: "application/vnd.ms-powerpoint",
    ps: "application/postscript",
    psd: "image/vnd.adobe.photoshop",
    py: "text/x-script.python",
    qt: "video/quicktime",
    ra: "audio/x-pn-realaudio",
    rake: "text/x-script.ruby",
    ram: "audio/x-pn-realaudio",
    rar: "application/x-rar-compressed",
    rb: "text/x-script.ruby",
    rdf: "application/rdf+xml",
    roff: "text/troff",
    rpm: "application/x-redhat-package-manager",
    rss: "application/rss+xml",
    rtf: "application/rtf",
    ru: "text/x-script.ruby",
    s: "text/x-asm",
    sgm: "text/sgml",
    sgml: "text/sgml",
    sh: "application/x-sh",
    sig: "application/pgp-signature",
    snd: "audio/basic",
    so: "application/octet-stream",
    svg: "image/svg+xml",
    svgz: "image/svg+xml",
    swf: "application/x-shockwave-flash",
    t: "text/troff",
    tar: "application/x-tar",
    tbz: "application/x-bzip-compressed-tar",
    tcl: "application/x-tcl",
    tex: "application/x-tex",
    texi: "application/x-texinfo",
    texinfo: "application/x-texinfo",
    text: "text/plain",
    tif: "image/tiff",
    tiff: "image/tiff",
    torrent: "application/x-bittorrent",
    tr: "text/troff",
    txt: "text/plain",
    vcf: "text/x-vcard",
    vcs: "text/x-vcalendar",
    vrml: "model/vrml",
    war: "application/java-archive",
    wav: "audio/x-wav",
    wma: "audio/x-ms-wma",
    wmv: "video/x-ms-wmv",
    wmx: "video/x-ms-wmx",
    wrl: "model/vrml",
    wsdl: "application/wsdl+xml",
    xbm: "image/x-xbitmap",
    xhtml: "application/xhtml+xml",
    xls: "application/vnd.ms-excel",
    xml: "application/xml",
    xpm: "image/x-xpixmap",
    xsl: "application/xml",
    xslt: "application/xslt+xml",
    yaml: "text/yaml",
    yml: "text/yaml",
    zip: "application/zip",
  };
  if (type === "ext") {
    var i = path.lastIndexOf(".");
    return i < 0 ? "" : path.substr(i);
  } else {
    var ext = path.split(".").pop();
    return extTypes[ext.toLowerCase()] || "application/octet-stream";
  }
};
var readTextFile = function (res, bucket, subid) {
  /*
   **  Reads S3 Object Text file and responds
   */
  if (subid.indexOf("?") !== -1) {
    subid = subid.substring(subid.lastIndexOf("?"));
  }
  s3fsImpl = new S3FS(bucket, {
    accessKeyId: aws.awsuserAuth.s3secure.accessKeyId,
    secretAccessKey: aws.awsuserAuth.s3secure.secretAccessKey,
    region: "us-east-1",
    ACL: "public-read",
  });
  try {
    s3fsImpl.readFile(subid, "utf8").then(
      function (data) {
        var code = new Buffer.from(data.Body).toString("ascii");
        res.send(code);
        res.end();
      },
      function (reason) {
        console.log(subid, reason); // Something went wrong
      }
    );
  } catch (err) {
    console.log(subid, err);
  }
};
var writeBase64File = function (res, bucket, subid, filename, content) {
  /*
   **  Writes Image Contents To S3 Object and responds with JSON
   */
  var workingdir = bucket + subid.replace(filename, ""),
    contentType = getContentType(filename, "type"),
    base64data = content;
  if (subid.charAt(0) === "/") subid = subid.substring(1);
  var params = {
    ACL: "public-read",
    Bucket: bucket,
    Key: subid + "/" + filename,
    ContentEncoding: "base64",
    Body: base64data,
    ContentType: contentType,
  };
  s3fsImpl = new S3FS(bucket, {
    accessKeyId: aws.awsuserAuth.s3secure.accessKeyId,
    secretAccessKey: aws.awsuserAuth.s3secure.secretAccessKey,
    region: "us-east-1",
    ACL: "public-read",
  });
  s3fsImpl
    .writeFile(params.Key, base64data, {
      ContentType: params.ContentType,
      ACL: params.ACL,
    })
    .then(function (err) {
      if (err) {
        console.log(err);
        data = {
          status: "failed",
          msg: err,
        };
      } else {
        data = {
          status: "success",
          msg: "File Saved: " + workingdir + "/" + filename,
          file: "https://s3.amazonaws.com/" + workingdir + "/" + filename,
        };
      }
      res.status(200).json(data);
    });
};
var writeTextFile = function (res, bucket, subid, filename, content) {
  /*
   **  Writes Text Contents To S3 Object and responds with JSON
   */
  var workingdir = bucket + subid.replace(filename, "");

  var contentType = getContentType(filename, "type");

  var base64data = content; //new Buffer(content, 'binary');
  if (subid.charAt(0) === "/") subid = subid.substring(1);
  var params = {
    Bucket: bucket,
    Key: subid + "/" + filename,
    Body: base64data,
    ContentType: contentType,
  };
  S3.upload(params, function (err, data) {
    if (err) {
      console.log("It's failed" + err);
      data = { status: "failed", msg: err };
    } else {
      data = {
        status: "success",
        msg: "File Saved: " + workingdir + "/" + filename,
      };
    }
    res.status(200).json(data);
  });
};
var readFolder = function (res, bucket, subid) {
  /*
   **  Reads Contents of S3 Folder and Responds with JSON listing
   */
  s3fsImpl = new S3FS(bucket, {
    accessKeyId: aws.awsuserAuth.s3secure.accessKeyId,
    secretAccessKey: aws.awsuserAuth.s3secure.secretAccessKey,
    region: "us-east-1",
    ACL: "public-read",
  });
  s3fsImpl.listContents(subid, subid).then(
    function (data) {
      res.status(200).json(data);
    },
    function (reason) {
      console.log(reason);
    }
  );
};
var getSignedURL = function (signed, id) {
  console.log(signed);
  S3.getSignedUrl("getObject", signed, function (err, url) {
    var data = {};
    if (err) {
      console.log(err);
      data = {
        id: 0,
        error: err,
        url: "https://s3.amazonaws.com/smartweb-pro.com/cdn/images/jpg/unauth.jpg",
      };
      return data;
    }
    console.log("URL: " + url);
    data = { id: id, url: url };
    return data;
  });
};
var postSignedURL = function (signed, id) {
  S3.createPresignedPost(signed, function (err, url) {
    if (err) {
      console.log(err);
      return {
        id: 0,
        error: "Error creating presigned URL",
        url: "https://s3.amazonaws.com/smartweb-pro.com/cdn/images/jpg/unauth.jpg",
      };
    }
    console.log(url);
    return { id: id, url: url };
  });
};
var uploadFile = function (bucketName, filePath, key, ctype) {
  fs.readFile(filePath, function (err, data) {
    if (err) console.error(err);
    var base64data = new Buffer.from(data, "binary");
    var params = {
      Bucket: bucketName,
      Key: key,
      Body: base64data,
      ContentType: ctype,
    };
    S3.upload(params, function (err, data) {
      if (err) {
        console.error("Upload Error " + err);
      } else {
        console.log("success");
      }
    });
  });
};
var listDirectory = function (res, bucket, prefix) {
  var dirlist = [],
    level = 1,
    lstatus = "failed",
    params = {
      Bucket: bucket,
      MaxKeys: 1000,
      Delimiter: "/",
      Prefix: prefix ? prefix : "",
    };
  S3.listObjectsV2(params, function (err, data) {
    if (err) {
      console.log("Error Reading Directory");
    } else {
      lstatus = "success";
      if (data.KeyCount > 0) {
        data.CommonPrefixes.forEach(function (item) {
          dirlist.push({ parent: level, name: item.Prefix });
        });
      }
    }
    res.status(200).json({ folders: dirlist, status: lstatus });
  });
};
var listBuckets = function (res, params) {
  var bucketlist = [],
    lstatus = "failed";
  S3.listBuckets(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log(data);
      lstatus = "success";
      data.Buckets.forEach(function (item) {
        bucketlist.push({ name: item.Name, created: item.CreationDate });
      });
    }
    res.status(200).json({ buckets: bucketlist, status: lstatus });
  });
};
var deleteObjects = function (res, params) {
  var lstatus = "failed";
  S3.deleteObjects(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      //  console.log(data);
      lstatus = "success";
    }
    res
      .status(200)
      .json({ bucket: params.Bucket, data: data, status: lstatus });
  });
};
var deleteBucket = function (res, params) {
  var lstatus = "failed";
  S3.deleteBucket(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      // console.log(data);
      lstatus = "success";
    }
    res
      .status(200)
      .json({ bucket: params.Bucket, data: data, status: lstatus });
  });
};
var createBucket = function (res, params) {
  var lstatus = "failed";
  S3.createBucket(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      //  console.log(data);
      lstatus = "success";
    }
    res
      .status(200)
      .json({ bucket: params.Bucket, data: data, status: lstatus });
  });
};
var copyObject = function (res, params) {
  var lstatus = "failed";
  S3.copyObject(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      // console.log(data);
      lstatus = "success";
    }
    res
      .status(200)
      .json({ bucket: params.Bucket, data: data, status: lstatus });
  });
};
/*------------------------------------------------------------------------*/
var writeS3File = function (req, res, s3fsImpl, params, logFileObject) {
  s3fsImpl
    .writeFile(params.Key, params.Body, {
      ContentType: params.ContentType,
      ACL: params.ACL,
    })
    .then(() => {
      msg = { status: 200, msg: "Upload Successful: " + longname, value: "" };
      sp.runLogging(logFileObject, function (err1, results) {
        if (err1) {
          (msg.status = 502),
            (msg.msg = "Update Successful and logging failure: ");
          msg.value += "\n" + err1.value;
        } else {
          msg.status = 503;
          msg.msg = "Update Successful and logging succeeded: ";
          msg.value += "\n" + results.value;
        }
      });
      res.json({
        status: 200,
        msg: "Update Successful: " + longname,
        value: msg,
      });
    })
    .catch((err) => {
      console.log("Error", err);
      msg = { status: 500, msg: "Failed to update: " + longname, value: err };
      sp.runLogging(logFileObject, function (err1, results) {
        if (err1) {
          (msg.status = 502),
            (msg.msg = "Failed to update and logging failed: ");
          msg.value += "\n" + err1.value;
        } else {
          msg.status = 503;
          msg.msg = "Failed to update but logging succeeded: ";
          msg.value += "\n" + results.value;
        }
      });
      res.json(msg);
    });
};
var writeS3Base64File = function (req, res, s3Object, S3USER, logFileObject) {
  var folderPath = s3Object.folderPath,
    contentType = s3Object.type,
    fileName = s3Object.fileName;
  (app = s3Object.app),
    (bucketPath = s3Object.bucket ? s3Object.bucket : S3USER.bucketName),
    (contents = req.body.contents),
    (defaultpath = S3only + "/" + bucketPath + app + folderPath),
    (longname = defaultpath + "/" + filename);
  const params = {
    ACL: s3Object.acl,
    Bucket: bucketPath,
    Key: app + "/" + folderPath + fileName,
    ContentEncoding: "base64",
    Body: contents,
    ContentType: contentType,
  };
  var s3fsImpl = new S3FS(S3USER.bucketName, {
    accessKeyId: S3USER.accessKeyId,
    secretAccessKey: S3USER.secretAccessKey,
    region: "us-east-1",
    ACL: params.ACL,
  });
  s3fsImpl.create(app + folderPath);
  writeS3File(req, res, s3fsImpl, params, logFileObject);
};
var writeS3BlobFile = function (req, res, s3Object, S3USER, logFileObject) {
  var folderPath = s3Object.folderPath,
    contentType = s3Object.type,
    fileName = s3Object.fileName;
  (app = s3Object.app),
    (bucketPath = s3Object.bucket ? s3Object.bucket : S3USER.bucketName),
    (defaultpath = S3only + "/" + bucketPath + app + folderPath),
    (longname = defaultpath + "/" + filename),
    (simage = req.body.img.replace(/^data:image\/\w+;base64,/, "")),
    (contents = new Buffer.from(simage, "base64"));

  const params = {
    ACL: s3Object.acl,
    Bucket: bucketPath,
    Key: app + "/" + folderPath + fileName,
    ContentEncoding: "base64",
    Body: contents,
    ContentType: contentType,
  };
  var s3fsImpl = new S3FS(S3USER.bucketName, {
    accessKeyId: S3USER.accessKeyId,
    secretAccessKey: S3USER.secretAccessKey,
    region: "us-east-1",
    ACL: params.ACL,
  });
  s3fsImpl.create(app + folderPath);
  writeS3File(req, res, s3fsImpl, params, content, logFileObject);
};
var saveS3File = function (req, res, s3Object, S3USER, logFileObject) {
  var folderPath = s3Object.folderPath,
    fileExt = s3Object.fileExt,
    fileType = s3Object.contentType,
    acl = s3Object.acl,
    fileName = s3Object.fileName,
    bucket = s3Object.bucket ? s3Object.bucket : S3USER.bucketName,
    contentsArray = [req.files.contents],
    longname = s3Object.fullUrl;

  const contents = Buffer.from(contentsArray);
  console.log("FILES: ", req.files);
  bucket = bucket.charAt(0) === "/" ? bucket.replace("/", "") : bucket;
  logFileObject.filename = longname;
  console.log("bucketPath: ", bucket, folderPath, fileName, fileExt);
  console.log("S3USER: ", S3USER);
  console.log("Contents: ", contents, s3Object.content, req.body);
  AWS.config.update({
    accessKeyId: S3USER.accessKeyId,
    secretAccessKey: S3USER.secretAccessKey,
  });
  AWS.config.region = "us-east-1";
  S3 = new AWS.S3({ apiVersion: "2006-03-01" });
  var params = {
    Key: folderPath + "/" + fileName,
    Bucket: bucket,
    ContentType: fileType,
    Body: contents,
    ACL: acl,
  };
  console.log(params);
  S3.upload(params, function (err, data) {
    var msg = {};
    if (err) {
      console.log("Error", err);
      msg = { status: 500, msg: "Failed to update: " + longname, value: err };
      sp.runLogging(logFileObject, function (err1, results) {
        if (err1) {
          (msg.status = 502),
            (msg.msg = "Failed to update and logging failed: ");
          msg.value += "\n" + err1.value;
        } else {
          msg.status = 503;
          msg.msg = "Failed to update but logging succeeded: ";
          msg.value += "\n" + results.value;
        }
      });
      res.json(msg);
    } else {
      if (data) {
        msg = {
          status: 200,
          msg: "Upload Successful: " + longname,
          value: data,
        };
        sp.runLogging(logFileObject, function (err1, results) {
          if (err1) {
            (msg.status = 502),
              (msg.msg = "Update Successful and logging failure: ");
            msg.value += "\n" + err1.value;
          } else {
            msg.status = 503;
            msg.msg = "Update Successful and logging succeeded: ";
            msg.value += "\n" + results.value;
          }
        });
        res.json({
          status: 200,
          msg: "Update Successful: " + longname,
          value: msg,
        });
      }
    }
    res.end();
  });
};
/*
  putS3File - sends a file to the S3 server
*/

var putS3File = function (req, res, s3Object, S3USER, logFileObject) {
  var bucket = s3Object.bucket ? s3Object.bucket : S3USER.bucketName,
    contents = req.body.contents;

  console.log("BODY: ", req.body, "FILES: ", req.files);

  bucket = bucket.charAt(0) === "/" ? bucket.replace("/", "") : bucket;
  s3Object.folderPath =
    s3Object.folderPath.charAt(0) === "/"
      ? s3Object.folderPath.substring(1)
      : s3Object.folderPath;
  AWS.config.update({
    accessKeyId: S3USER.accessKeyId,
    secretAccessKey: S3USER.secretAccessKey,
  });
  S3 = new AWS.S3({
    region: s3Object.region,
    apiVersion: "2006-03-01",
  });
  var params = {
    Key: s3Object.folderPath + "/" + s3Object.fileName,
    Bucket: bucket,
    ContentType: s3Object.fileType,
    Body: contents,
    ACL: s3Object.acl,
  };
  params.Body =
    req.files && req.files.contents.path !== undefined
      ? fs.createReadStream(req.files.contents.path)
      : contents;

  console.log(params);

  S3.upload(params, function (err, data) {
    postFileResponseLog(req, res, logFileObject, err, data);
  });
};

var zepcrmQuery = function (req, res, query) {
  settings.dbConfig.azure["connectionTimeout"] = 100000;

  //console.log(mySqlOptions, settings.dbConfig.azure);

  const AZURE = new mysql.createConnection(settings.dbConfig.azure);
  AZURE.connect((error) => {
    if (error) {
      console.error("Failed to connect to Azure MySQL Database:", error);
    } else {
      console.log("Connected to Azure MySQL Database");
      AZURE.query(
        query,
        //      ["1"],
        async function (err, results, fields) {
          if (err) {
            console.log(`Query Failed:`, err);
            res.status(500);
          } else {
            //console.log(`Successful`, results);
            res.status(200).json(results);
          }
          AZURE.end((err) => {
            if (err) {
              res.status(500).send(err);
            }
          });
        }
      );
    }
  });
};

var zepcrmDB = function (req, res, procObject) {
  const query = procObject.query;

  settings.dbConfig.azure["connectionTimeout"] = 20000;

  //console.log(mySqlOptions, settings.dbConfig.azure);

  const AZURE = new mysql.createConnection(settings.dbConfig.azure);
  AZURE.connect((error) => {
    if (error) {
      console.error("Failed to connect to Azure MySQL Database:", error);
    } else {
      console.log("Connected to Azure MySQL Database");
      AZURE.query(
        query,
        //      ["1"],
        function (err, results, fields) {
          if (err) {
            console.log(`Query Failed:`, err);
            res.status(500);
          } else {
            console.log(`Successful`);
            var msg = { status: 200, value: "", msg: "Update" };
            procObject.parameters[0].value = JSON.stringify(results);
            //console.log(procObject);

            db.executeProcedure(procObject, function (err1, responsemsg) {
              if (err1) {
                msg.status = 502;
                msg.msg = "Failed to update: ";
                msg.value += "\n" + err1.value;
              } else {
                msg = {
                  status: 200,
                  msg: "Update Successful: ",
                };
              }
              res.status(msg.status).json(responsemsg);
            });
          }
          AZURE.end((err) => {
            if (err) {
              console.error("Failed to end connection:", err);
            } else {
              console.log("Done: connection closed");
            }
          });
        }
      );
    }
  });
};
var postFileResponseLog = function (req, res, logFileObject, err, data) {
  var msg = { status: 200, value: "", msg: "" };
  console.log("DATA:", data, err);
  if (err) {
    console.log("Error", err);
    msg = {
      status: 500,
      msg: "Failed to update: " + logFileObject.fullUrl,
      value: err,
    };
    db.executeProcedure(logFileObject, function (err1, results) {
      if (err1) {
        msg.status = 502;
        msg.msg = "Failed to update and logging failed: ";
        msg.value += "\n" + err1.value;
      } else {
        msg.status = 503;
        msg.msg = "Failed to update but logging succeeded: ";
        msg.value += "\n" + results.value;
      }
    });
    res.json(msg);
  } else {
    if (data) {
      msg = {
        status: 200,
        msg: "Upload Successful: " + logFileObject.fullUrl,
        value: data,
      };
      console.log(msg);
      db.executeProcedure(logFileObject, function (err1, results) {
        if (err1) {
          msg.status = 502;
          msg.msg = "Update Successful and logging failure: ";
          msg.value += "\n" + err1.value;
        } else {
          msg.status = 503;
          msg.msg = "Update Successful and logging succeeded: ";
          msg.value += "\n" + results.value;
        }
      });
      res.json({
        status: 200,
        msg: "Update Successful: " + logFileObject.fullUrl,
        value: msg,
      });
    }
  }
};

var retrieveS3File = function (req, res, s3Object, S3USER, logFileObject) {
  var defaultpath = S3only + "/" + bucketPath + app + folderPath,
    longname = defaultpath + "/" + filename;
  (folderPath = s3Object.folderpath),
    (fileType = s3Object.type),
    (app = s3Object.app),
    (filename = s3Object.file),
    (bucketPath = s3Object.bucket ? s3Object.bucket : S3USER.bucketName);
  const params = {
    Bucket: bucketPath,
    Key: app + "/" + folderPath + "/" + filename,
  };
  logFileObject.longname = longname;

  S3.getObject(params, (err, data) => {
    var msg = {};
    if (err) {
      console.log("Error", err);
      msg = { status: 500, msg: "Failed to retrieve: " + longname, value: err };
      sp.runLogging(logFileObject, function (err1, results) {
        if (err1) {
          (msg.status = 502),
            (msg.msg = "Failed to retrieve and logging failed: ");
          msg.value += "\n" + err1.value;
        } else {
          msg.status = 503;
          msg.msg = "Failed to retrieve but logging succeeded: ";
          msg.value += "\n" + results.value;
        }
      });
      res.json(msg);
    } else {
      if (data) {
        msg = {
          status: 200,
          msg: "Retrieve Successful: " + longname,
          value: data,
        };
        sp.runLogging(logFileObject, function (err1, results) {
          if (err1) {
            (msg.status = 504),
              (msg.msg = "Retrieve Successful and logging failure: ");
            msg.value += "\n" + err1.value;
            res.json(data.body);
          } else {
            msg.status = 200;
            msg.msg = "Retrieve Successful and logging succeeded: ";
            msg.value += "\n" + results.value;
            res.setHeader("Content-Type", fileType);
            res.setHeader(
              "Content-Disposition",
              'attachment; filename="' + params.Key + '"'
            );
            res.json(data.body);
          }
        });
      }
      res.end();
    }
  });
};
var saveSignedFile = function (req, res) {};
var retrieveSignedUrl = function (req, res, s3Object, S3USER, logFileObject) {
  var defaultpath = S3only + "/" + bucketPath + app + folderPath,
    longname = defaultpath + "/" + filename;
  (folderPath = s3Object.folderpath),
    (fileType = s3Object.type),
    (app = s3Object.app),
    (filename = s3Object.file),
    (bucketPath = s3Object.bucket ? s3Object.bucket : S3USER.bucketName);
  const params = {
    Bucket: bucketPath,
    Key: app + "/" + folderPath + "/" + filename,
    Expires: 60,
  };
  logFileObject.longname = longname;
  AWS.config.update({
    accessKeyId: S3USER.accessKeyId,
    secretAccessKey: S3USER.secretAccessKey,
  });
  AWS.config.region = "us-east-1";
  S3 = new AWS.S3({ apiVersion: "2006-03-01" });
  S3.getSignedUrl("getObject", signed, function (err, data) {
    var msg = {};
    if (err) {
      console.log("Error", err);
      msg = {
        status: 500,
        msg: "Failed to retrieve URL: " + longname,
        value: err,
      };
      sp.runLogging(logFileObject, function (err1, results) {
        if (err1) {
          msg.status = 502;
          msg.msg = "Failed to retrieve URL and logging failed: ";
          msg.value += "\n" + err1.value;
        } else {
          msg.status = 503;
          msg.msg = "Failed to retrieve URL but logging succeeded: ";
          msg.value += "\n" + results.value;
        }
        res.status(200).json({
          id: 0,
          url: "https://s3.amazonaws.com/smartweb-pro.com/cdn/images/jpg/unauth.jpg",
          msg: msg,
        });
      });
    } else {
      if (data) {
        msg = {
          status: 200,
          msg: "Retrieve URL Successful: " + longname,
          value: data,
        };
        sp.runLogging(logFileObject, function (err1, results) {
          if (err1) {
            msg.status = 504;
            msg.msg = "Retrieve Successful and logging failed: ";
            msg.value += "\n" + err1.value;
            res.status(200).json({ id: id, url: data, msg: msg });
          } else {
            msg.status = 200;
            msg.msg = "Retrieve Successful and logging succeeded: ";
            msg.value += "\n" + results.value;
            res.status(200).json({ id: id, url: data, msg: msg });
          }
        });
      }
      res.end();
    }
  });
};
/*------------------------------------------------------------------------*/

/*------------------------------------------------------------------------*/
module.exports = function (router, passport) {
  router.use(passport.authenticate("bearer", { session: false }));
  router.use(function (req, res, next) {
    var timedate = new Date().toISOString();
    var username =
      req.user && req.user.data && req.user.data.local.username
        ? req.user.data.local.username
        : "no user defined";
    var logEntry = `{ type: 'Access Granted', path: '/sys${req.path}', user: '${username}', ip: '${req.ip}' time: '${timedate}', token: '${req.query.access_token}'},\n`;
    fs.appendFile("logs.txt", logEntry, function (err) {
      next();
    });
  });
  router.post("/s3/copy", function (req, res) {
    /*
     **  Deletes File From S3 Bucket
     */
    var params = JSON.parse(req.body.sp_params),
      path = params.path,
      secure = params.secure === "secure" ? true : false,
      testbed = params.secure === "testbed" ? true : false,
      bucket = params.bucket,
      key = params.key,
      userdata = req.user.data;

    copyObject(res, { Bucket: bucket, CopySource: path, Key: key });
  });
  router.post("/s3/deletebucket", function (req, res) {
    /*
     **  Deletes File From S3 Bucket
     */
    var params = JSON.parse(req.body.sp_params),
      secure = params.secure === "secure" ? true : false,
      testbed = params.secure === "testbed" ? true : false,
      bucket = params.bucket,
      userdata = req.user.data;

    deleteBucket(res, { Bucket: bucket });
  });
  router.post("/s3/delete", function (req, res) {
    /*
     **  Deletes File From S3 Bucket
     */
    var params = JSON.parse(req.body.sp_params),
      paths = params.paths,
      secure = params.secure === "secure" ? true : false,
      testbed = params.secure === "testbed" ? true : false,
      bucket = params.bucket,
      userdata = req.user.data;

    deleteObjects(res, { Bucket: bucket, Delete: { Objects: paths } });
  });
  router.post("/s3/write/:secure", function (req, res) {
    /*
     **  Writes Contents of File To S3 Object
     */
    var params = JSON.parse(req.body.sp_params),
      path = params.path,
      secure =
        params.secure === "secure"
          ? true
          : req.params.secure === "secure"
          ? true
          : false,
      testbed =
        params.secure === "testbed"
          ? true
          : req.params.secure === "testbed"
          ? true
          : false,
      bucket = params.bucket,
      userdata = req.user.data,
      fname = params.filename,
      signed = {
        Bucket: bucket,
        Expires: 60,
        Key: path,
      },
      subid = "/";
    path = path.replace(bucket, "");
    if (path) {
      if (testbed) {
        path =
          "subscribers/" +
          userdata.subscriberid +
          "/" +
          userdata.local.id +
          "/" +
          path;
      }
      subid += path;
    }
    //  console.log(bucket, subid, fname)
    signed.Key = subid.replace("//", "/");
    writeTextFile(res, bucket, subid, fname, params.contents);
  });
  router.post("/s3/mkdir/:secure", function (req, res) {
    /*
     **  Creates S3 Folder
     */
    s3fsImpl.mkdirp("test-folder").then(
      function () {
        // Directory has been recursively created
      },
      function (reason) {
        // Something went wrong
      }
    );
  });
  router.get("/s3/worker/:filename", (req, res) => {
    const directory = "cdn/smart/widget/",
      params = {
        Bucket: "smartweb-pro.com",
        Key: directory + req.params.filename,
      };

    S3.getObject(params, (err, data) => {
      if (err) {
        console.log("Error downloading file from S3: ", err);
        res.status(500).send("Error downloading file from S3");
      } else {
        // Set the headers to allow PDF file download
        const contentType = data.ContentType;
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="' + params.Key + '"'
        );

        // Send the PDF file data to the client
        res.send(data.Body);
      }
    });
  });
  router.get("/s3/file/:filename", (req, res) => {
    const directory = req.query.path ? req.query.path + "/" : "",
      params = {
        Bucket: defaultBucketName,
        Key: directory + req.params.filename,
      };

    S3.getObject(params, (err, data) => {
      if (err) {
        console.log("Error downloading file from S3: ", err);
        res.status(500).send("Error downloading file from S3");
      } else {
        // Set the headers to allow PDF file download
        const contentType = data.ContentType;
        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="' + params.Key + '"'
        );

        // Send the PDF file data to the client
        res.send(data.Body);
      }
    });
  });
  router.get("/s3/pdf/:filename", (req, res) => {
    // Replace '{bucket}' and '{key}' with the appropriate values for your S3 bucket and PDF file
    const params = {
      Bucket: "snapin-backup-repo",
      Key: "gtm/dbqpro/pdfs/" + req.params.filename,
    };
    //console.log(params);
    // Download the PDF file from S3
    S3.getObject(params, (err, data) => {
      if (err) {
        console.log("Error downloading file from S3: ", err);
        res.status(500).send("Error downloading file from S3");
      } else {
        // Set the headers to allow PDF file download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="' + params.Key + '"'
        );

        // Send the PDF file data to the client
        res.send(data.Body);
      }
    });
  });
  router.post("/s3/project/json", (req, res) => {
    // Replace '{bucket}' and '{key}' with the appropriate values for your S3 bucket and PDF file
    const s3 = new AWS.S3();
    const params = {
      Bucket: req.body.Bucket,
      Key: req.body.Key,
    };
    //console.log(params);
    // Download the PDF file from S3
    S3.getObject(params, (err, data) => {
      if (err) {
        res.status(err.statusCode).send("Error downloading file from S3");
      } else {
        // Set the headers to allow PDF file download
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="' + params.Key + '"'
        );

        // Send the PDF file data to the client
        res.send(data.Body);
      }
    });
  });
  router.get("/s3/json/:subdir/:filename", (req, res) => {
    // Replace '{bucket}' and '{key}' with the appropriate values for your S3 bucket and PDF file
    const s3 = new AWS.S3();
    const fixFile = req.params.filename.replace(".json", ".proj");
    const params = {
      Bucket: "snapin-backup-repo",
      Key: `gtm/dbqpro/projects/${fixFile}`,
    };
    // console.log(params);
    // Download the PDF file from S3
    S3.getObject(params, (err, data) => {
      if (err) {
        res.status(err.statusCode).send("Error downloading file from S3");
      } else {
        // Set the headers to allow PDF file download
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="' + params.Key + '"'
        );

        // Send the PDF file data to the client
        res.send(data.Body);
      }
    });
  });
  router.get("/s3/read/:secure", function (req, res) {
    /*
     **  Reads Contents of File From S3 Object
     */
    var path =
        req.query.path.charAt(0) === "/"
          ? req.query.path.substring(1)
          : req.query.path,
      secure = req.params.secure === "secure" ? true : false,
      testbed = req.params.secure === "testbed" ? true : false,
      bucket = path.substring(0, path.indexOf("/")),
      userdata = req.user.data,
      fname = path.substring(path.lastIndexOf("/") + 1),
      params = {
        Bucket: bucket,
        Expires: 60,
        Key: path,
      },
      signed = {},
      urlpath = "",
      subid = "/";
    path = path.replace(bucket, "");
    if (path) {
      if (testbed) {
        path =
          bucket +
          "/subscribers/" +
          userdata.subscriberid +
          "/" +
          userdata.local.id +
          "/" +
          path +
          "/" +
          fname;
      }
      subid += path;
    }
    subid = subid.replace("//", "");
    readTextFile(res, bucket, subid);
  });
  router.get("/s3/root/:secure", function (req, res) {
    /*
     **  Reads S3 folder and return list of Objects
     */
    var path =
        req.query.path.charAt(0) === "/"
          ? req.query.path.substring(1)
          : req.query.path,
      secure = req.params.secure === "secure" ? true : false,
      bucket = path.substring(0, path.indexOf("/")); // === "secure") ? "secure-smartweb-pro-com" : "smartweb-pro.com",
    (userdata = req.user.data), (subid = "/");
    path = path.replace(bucket, "");
    if (path) {
      subid += path;
    }
    subid = subid.replace("//", "");
    readFolder(res, bucket, subid);
  });
  router.post("/s3/signed/url/:dest", function (req, res) {
    /*
     **  Requests a signed url for file object and returns secure img json with image url
     */
    var userdata = req.user.data,
      subid =
        req.params.dest === "root"
          ? ""
          : "subscribers/" + userdata.subscriberid + "/" + userdata.id + "/",
      params = JSON.parse(req.body.sp_params),
      id = params.id,
      fullpath = params.url.replace("https://", ""),
      awspath =
        fullpath.indexOf("s3") === 0
          ? fullpath.replace("s3.amazonaws.com/", "")
          : fullpath.replace(".s3.amazonaws.com", ""),
      bucket = awspath.substring(0, awspath.indexOf("/")),
      key = subid + awspath.replace(bucket + "/", ""),
      signed = {
        Bucket: bucket,
        Expires: 60,
        Key: key,
      };

    fs.appendFile(
      "log_secure.txt",
      JSON.stringify({
        ip: req.ip,
        requestdate: new Date(),
        user: req.user.data.local.username,
        token: req.query.access_token,
        bucket: bucket,
        key: key,
      }) +
        String.fromCharCode(13) +
        String.fromCharCode(10),
      { encoding: "utf8", mode: 0o666, flag: "a" },
      function (err) {
        if (err) {
          console.log(err);
        }
        S3.getSignedUrl("getObject", signed, function (err, url) {
          if (err) {
            console.log(err);
            id = 0;
            url =
              "https://s3.amazonaws.com/smartweb-pro.com/cdn/images/jpg/unauth.jpg";
          }
          res.status(200).json({ id: id, url: url });
        });
      }
    );
  });
  router.post("/s3/upload/:secure", function (req, res) {
    /*
     **  Upload loads a file or files to S3 folder and return list of Objects loaded
     **  and posts link to data record or link record in 1:M table
     */
    /*
     **  Writes Contents of File To S3 Object
     */
    var params = JSON.parse(req.body.sp_params),
      path = params.PATH,
      secure = params.secure === "secure" ? true : false,
      testbed = params.secure === "testbed" ? true : false,
      bucket = params.BUCKET,
      aResp = [],
      files = params.files,
      afiles = [],
      userdata = req.user.data,
      signed = {
        Bucket: bucket,
        Expires: 60,
        Key: path,
      },
      subid = "/";
    // console.log(params);
    //console.log(req.body);
    // console.log('NEW RUN');
    if (req.files.FILE.path) {
      afiles.push(req.files.FILE);
    } else {
      for (i = 0; i < req.files.FILE.length; i++) {
        afiles.push(req.files.FILE[i]);
      }
    }
    //  console.log(afiles);
    //   console.log('NEW RUN A');
    path = path.substring(1);
    for (i = 0; i < afiles.length; i++) {
      uploadFile(
        bucket,
        afiles[i].path,
        path + "/" + afiles[i].name,
        afiles[i].headers["content-type"]
      );
    }
  });
  router.post("/s3/list/buckets", function (req, res) {
    var params = JSON.parse(req.body.sp_params),
      path = params.path,
      secure = params.secure === "secure" ? true : false,
      testbed = params.secure === "testbed" ? true : false,
      bucket = params.bucket,
      userdata = req.user.data;
    params = {};
    listBuckets(res, params);
  });
  router.post("/s3/list/directorytree", function (req, res) {
    /*
     **  Reads S3 folder and return list of Objects
     */
    var params = JSON.parse(req.body.sp_params),
      path = params.path,
      secure = params.secure === "secure" ? true : false,
      testbed = params.secure === "testbed" ? true : false,
      bucket = params.bucket,
      userdata = req.user.data;
    listDirectory(res, bucket, path);
  });
  router.post("/s3/create/bucket", function (req, res) {
    /*
     **  Reads S3 folder and return list of Objects
     */
    var params = JSON.parse(req.body.sp_params),
      action = req.params.type,
      access = params.access ? params.access : "public-read",
      region = params.region ? params.region : "us-east-2",
      secure = params.secure === "secure" ? true : false,
      testbed = params.secure === "testbed" ? true : false,
      bucket = params.bucket,
      userdata = req.user.data;
    if (bucket.indexOf("secure-") > -1) {
      access = "private";
    }
    createBucket(res, {
      Bucket: bucket,
      ACL: access,
      CreateBucketConfiguration: { LocationConstraint: region },
    });
  });
  router.post("/s3/screencapture/:ftype", function (req, res) {
    var userdata = req.user.data,
      subid = "/cdn/smart/images/screenshots/" + req.params.ftype + "s/",
      data = null,
      base64data = null,
      parameters = JSON.parse(req.body.sp_params),
      bucket = parameters.bucket,
      contents = parameters.contents,
      filename = parameters.filename;
    data = contents.replace(/^data:image\/\w+;base64,/, "");
    base64data = new Buffer.from(data, "base64");
    writeBase64File(res, bucket, subid, filename, base64data);
  });
  /*--------------------------------------------------------------*/
  router.post("/s3/gtm/save/file", function (req, res) {
    var userdata = req.user.data,
      s3Object = JSON.parse(req.body.s3Object),
      schema = "gtm",
      S3USER = aws.gtmuserAuth.s3secure,
      logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        params: {
          userID: userdata.id,
          filename: longname,
          action: "Save File",
          SubscriberID: userdata.subscriberid,
        },
      };
    saveS3File(req, res, s3Object, S3USER, logFileObject);
  });
  router.post("/s3/gtm/retrieve", function (req, res) {
    var userdata = req.user.data,
      s3Object = JSON.parse(req.body.s3Object);
    (schema = "gtm"),
      (S3USER = aws.gtmuserAuth.s3secure),
      (logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        params: {
          userID: userdata.id,
          filename: longname,
          action: "Retrieve File",
          SubscriberID: userdata.subscriberid,
        },
      });
    retrieveS3File(req, req, s3Object, S3USER, logFileObject);
  });
  router.post("/s3/gtm/signed/retrieve", function (req, res) {
    var userdata = req.user.data,
      schema = "gtm",
      S3USER = aws.gtmuserAuth.s3secure,
      s3Object = JSON.parse(req.body.s3Object),
      logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        params: {
          userID: userdata.id,
          filename: longname,
          action: "Retrieve File URL",
          SubscriberID: userdata.subscriberid,
        },
      };
    retrieveSignedUrl(req, req, s3Object, S3USER, logFileObject);
  });
  router.post("/s3/gtm/signed/save/file", function (req, res) {
    //console.log(req.body);
    var userdata = req.user.data,
      schema = "gtm",
      S3USER = aws.gtmuserAuth.s3secure,
      s3Object = JSON.parse(req.body.s3Object),
      logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        params: {
          userID: userdata.id,
          filename: longname,
          action: "Retrieve File URL",
          SubscriberID: userdata.subscriberid,
        },
      };
    //console.log(S3USER, s3Object, logFileObject);
  });
  router.post("/s3/gtm/signed/save/file/:account", function (req, res) {
    var userdata = req.user.data,
      schema = "SmartWeb",
      S3USER = aws.awsuserAuth[req.query.account],
      s3Object = JSON.parse(req.body.s3Object),
      logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        params: {
          userID: userdata.id,
          filename: longname,
          action: "Retrieve File URL",
          SubscriberID: userdata.subscriberid,
        },
      };
    //console.log(S3USER, s3Object, logFileObject);
  });
  router.post("/s3/gtm/db/query/:procedure/:id", function (req, res) {
    var userdata = req.user.data,
      today = new Date(),
      companyid = 16,
      procedure = req.params.procedure,
      processid = parseInt(req.params.id, 10),
      query = "";

    today = today.toISOString().slice(0, 10);
    /*
    const zepcrm_queries = [
      "",
        `SELECT cid, name FROM zepcrm.company where active = 1`,
        `SELECT lid, lName, fName, phone, email, companyID, campaignID, statusID, affiliateID, created FROM zepcrm.leads where companyID = ${companyid} and statusID = 163 order by lastActionCreated`,
        `SELECT sid, name, cid, percent, active, created FROM zepcrm.status where cid = ${companyid}`,
        `SELECT id, platform, ad_name, campaign_name, form_id, lead_name, lead_email, lead_phone, lead_created, active, created FROM zepcrm.rawleadslog`,
    ];
    query = zepcrm_queries[processid];
    */
    db.executeSql(
      `select CubeID, ReadQuery from [SmartWeb].[dbo].[swCubes] where CubeID=${processid}`,
      (err, results) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          //          console.log(results);
          query = results.recordset[0][1];

          //          console.log("QUERY: ", query);
          query = decodeURIComponent(query);
          //          console.log("DECODED QUERY: ", query);
          if (query !== "") {
            const procObject = {
              procedure: `gtm.dbo.${procedure}`,
              parameters: [
                { name: "PARAMS", type: "nvarchar", value: "" },
                {
                  name: "SubscriberID",
                  type: "uniqueidentifier",
                  value: userdata.subscriberid,
                },
              ],
              query: query,
            };
            zepcrmDB(req, res, procObject);
          } else {
            console.log("No Query Selected");
            res.end();
          }
        }
      }
    );
  });
  router.post("/db/update/cube", async function (req, res) {
    /*
      Updates the Cube Query for a given CubeID
     */
    const Parameters = MSSQL.extractParameters(req.body);

    //    console.log(req.body);
    const query = `UPDATE SmartWeb.dbo.swCubes SET ReadQuery = @readQuery WHERE CubeID = @cubeId`;
    //   console.log(query);
    const results = await MSSQL.execQuery(query, Parameters);
    //   console.log(results);
    if (results.err) {
      return res.status(500).send(results.err);
    }
    res.status(200).json(results.data);
  });
  router.post("/db/query/cube/:id", async function (req, res) {
    /*
      Executes a specific Cube Query based on given CubeID pass as id in endpoint
    */

    const options = {
      cubeId: req.params.id,
      user: req.user,
    };
    const cubeQuery = await MSSQL.getCubeQuery(options);
    const Parameters = MSSQL.extractParameters(req.body);
    if (cubeQuery.err) {
      return res.status(403).send(cubeQuery.err);
    }

    //    console.log("Parameters: ", cubeQuery, Parameters);
    const results = await MSSQL.execQuery(cubeQuery.data, Parameters);
    //    console.log(results);
    if (results.err) {
      return res.status(500).send(results.err);
    }
    res.status(200).json(results.data);
  });
  router.post("/upsert/json", async function (req, res) {
    /*
      Upserts A JSON to a given Procedure
    */
    //    console.log(req.body);
    const options = {
      db: req.body.db,
      procedureName: req.body.procedureName,
      json: JSON.stringify(req.body.json),
      user: req.user,
    };
    // console.log(options);
    const ProcedureName = `${options.db}.dbo.${options.procedureName}`;
    let Parameters = {
      jsonData: { type: "NVARCHAR", size: -1, value: options.json },
    };
    // console.log(ProcedureName);
    // Parameters.jsonData.value = JSON.stringify(results.data);
    const updateResults = await MSSQL.execProcedure(ProcedureName, Parameters);
    res.status(200).json(updateResults);
  });
  router.post("/upsert/one2many/json", async function (req, res) {
    /*
      Upserts A One to Many JSON Object to a given Procedure
    */
    //console.log(req.body);

    const options = {
      db: req.body.db,
      procedureName: req.body.procedureName,
      json: JSON.stringify(req.body.json),
      main: JSON.stringify(req.body.main),
      user: req.user,
    };
    // console.log(options);
    const ProcedureName = `${options.db}.dbo.${options.procedureName}`;
    let Parameters = {
      mainData: { type: "NVARCHAR", size: -1, value: options.main },
      jsonData: { type: "NVARCHAR", size: -1, value: options.json },
    };
    //console.log(ProcedureName);
    // Parameters.jsonData.value = JSON.stringify(results.data);
    const updateResults = await MSSQL.execProcedure(ProcedureName, Parameters);
    res.status(200).json(updateResults);
  });
  /*--------------------------------------------------------------*/

  router.post("/neo4j/query/:write", async function (req, res) {
    /*
      Used to Execute a Query on Neo4J Graph Database :write = [read|write]
    */

    const query = req.body.query;
    const readWrite = req.params.write;
    //   console.log(query);
    // Parameters.jsonData.value = JSON.stringify(results.data);
    const updateResults = await NEO4J.execQuery(query, readWrite);
    res.status(200).json(updateResults);
  });
  router.post("/neo4j/query/batch/:write", async function (req, res) {
    /*
      Used to Execute a Batch of Query on Neo4J Graph Database :write = [read|write]
    */

    let query = req.body.query;
    const readWrite = req.params.write;
    //  console.log(query);
    // Parameters.jsonData.value = JSON.stringify(results.data);
    const updateResults = await NEO4J.execQueryBatch(query, readWrite);
    res.status(200).json(updateResults);
  });
  router.post("/neo4j/query/cube/:id", async function (req, res) {
    /*
      Executes a specific Cube Query based on given CubeID pass as id in endpoint
    */

    const options = {
      cubeId: req.params.id,
      user: req.user,
    };
    const cubeQuery = await MSSQL.getCubeQuery(options);
    const Parameters = MSSQL.extractParameters(req.body);
    if (cubeQuery.err) {
      return res.status(403).send(cubeQuery.err);
    }
    // console.log("Parameters: ", cubeQuery, Parameters);
    const results = await NEO4J.execQuery(cubeQuery.data, "read");
    if (results.err) {
      return res.status(500).send(results.err);
    }
    res.status(200).json(results.data);
  });
  /*--------------------------------------------------------------*/
  router.post("/crm/db/query/:id", async function (req, res) {
    const options = {
      cubeId: req.params.id,
      user: req.user,
    };
    const cubeQuery = await MSSQL.getCubeQuery(options);
    const Parameters = MYSQL.extractParameters(req.body);
    if (cubeQuery.err) {
      return res.status(403).send(cubeQuery.err);
    }

    //console.log("Parameters: ", Parameters);
    const results = await MYSQL.execQuery(cubeQuery.data, Parameters);
    //console.log(results);
    if (results.err) {
      return res.status(500).send(results.err);
    }
    res.status(200).json(results.data);
  });
  router.get("/crm/db/query/:id", async function (req, res) {
    const options = {
      cubeId: req.params.id,
      user: req.user,
    };
    const cubeQuery = await MSSQL.getCubeQuery(options);
    if (cubeQuery.err) {
      return res.status(403).send(cubeQuery.err);
    }
    const results = await MYSQL.execQuery(cubeQuery.data);
    //console.log(results);
    if (results.err) {
      return res.status(500).send(results.err);
    }
    res.status(200).json(results.data);
  });
  router.get(
    "/crm/upsert/json/:db/:procedureName/:id",
    async function (req, res) {
      const options = {
        cubeId: req.params.id,
        user: req.user,
      };
      const ProcedureName = `${req.params.db}.dbo.Upsert${req.params.procedureName}`;
      let Parameters = {
        jsonData: { type: "NVARCHAR", size: -1, value: null },
      };
      //console.log(ProcedureName);
      const cubeQuery = await MSSQL.getCubeQuery(options);
      if (cubeQuery.err) {
        return res.status(403).send(cubeQuery.err);
      }
      const results = await MYSQL.execQuery(cubeQuery.data);
      if (results.err) {
        return res.status(500).send(results.err);
      }
      Parameters.jsonData.value = JSON.stringify(results.data);
      const updateResults = await MSSQL.execProcedure(
        ProcedureName,
        Parameters
      );
      res.status(200).json(updateResults);
    }
  );
  router.post(
    "/crm/upsert/json/:db/:procedureName/:id",
    async function (req, res) {
      const options = {
        cubeId: req.params.id,
        user: req.user,
      };
      const ProcedureName = `${req.params.db}.dbo.Upsert${req.params.procedureName}`;
      let Parameters = {
        jsonData: { type: "NVARCHAR", size: -1, value: null },
      };
      // console.log(ProcedureName);
      const cubeQuery = await MSSQL.getCubeQuery(options);
      const Params = MYSQL.extractParameters(req.body);
      if (cubeQuery.err) {
        return res.status(403).send(cubeQuery.err);
      }
      const results = await MYSQL.execQuery(cubeQuery.data, Params);
      //console.log(results);
      if (results.err) {
        return res.status(500).send(results.err);
      }
      //console.log(results);
      Parameters.jsonData.value = JSON.stringify(results.data);
      const updateResults = await MSSQL.execProcedure(
        ProcedureName,
        Parameters
      );
      res.status(200).json(updateResults);
    }
  );
  router.post("/crm/usp/:db/:procedureName", async function (req, res) {
    const ProcedureName = `${req.params.db}.usp_${req.params.procedureName}`;
    const Parameters = req.body;
    //console.log(ProcedureName, Parameters);
    const results = await MYSQL.execProcedure(ProcedureName, Parameters);
    //console.log("Endpoint: ", results);
    res.json(results);
  });
  router.get("/crm/api/files/:lead/:id", async function (req, res) {
    let EndPoint = `external/v1/leads/${req.params.lead}/files/${req.params.id}?key=389574ea-c113-4e8d-ba59-86c57c26d9fd`;
    const Parameters = req.body;
    //console.log(EndPoint, Parameters);
    const results = await ZEPCRM.callApi(EndPoint, "GET", Parameters);
    res.setHeader("Response-Type", ZEPCRM.detectFileType(results.data));
    res.setHeader("Content-Length", results.data.length);
    res.status(200).send(results.data);
  });
  router.post("/document-ocr/status", function (req, res) {
    res.status(200).send("Status Message Received");
  });
  router.get("/document-ocr/doc_list", async function (req, res) {
    let EndPoint = `document-ocr-api.azurewebsites.net/api/doc_list`;
    const Parameters = null;
    //console.log(EndPoint, Parameters);
    const results = await ZEPCRM.callEndpoint(
      EndPoint,
      "GET",
      Parameters,
      "application/json"
    );
    // console.log("document-ocr list", results);
    res.status(200).send(results.data);
  });
  router.get("/document-ocr/doc_result", async function (req, res) {
    let EndPoint = `document-ocr-api.azurewebsites.net/api/doc_ocr?fileid=${req.query.fileid}`;
    EndPoint += req.query.jobid ? `&jobid=${req.query.jobid}` : "";
    EndPoint += req.query.pagestart ? `&pagestart=${req.query.pagestart}` : "";
    EndPoint += req.query.pageend ? `&pageend=${req.query.pageend}` : "";
    const Parameters = null;
    //console.log(EndPoint, req.query);
    const results = await ZEPCRM.callEndpoint(
      EndPoint,
      "GET",
      Parameters,
      "application/json"
    );
    //console.log("document-ocr result", results);
    res.status(200).send(results.data);
  });

  router.post("/document-ocr/doc_queue", async function (req, res) {
    let EndPoint = `document-ocr-api.azurewebsites.net/api/doc_ocr`;
    const Parameters = req.body;
    // console.log(EndPoint, Parameters);
    const results = await ZEPCRM.callEndpoint(
      EndPoint,
      "POST",
      Parameters,
      "application/json"
    );
    //console.log("document-ocr queue", results);
    if (results.err) {
      res
        .status(results.err.response.status)
        .send({ message: results.err.response.data });
    } else {
      res.status(200).send(results.data);
    }
  });

  router.post("/crm/api/post/:endpoint", async function (req, res) {
    let EndPoint = req.params.endpoint;
    let contentType = req.get("Content-Type");
    let data = req.query;
    // console.log("api/post/", req.query, contentType, req.headers, EndPoint);
    let params = "?";
    for (prop in data) {
      params += `${prop}=${data[prop]}&`;
    }
    if (params !== "?") {
      EndPoint = `${EndPoint}${params}key=389574ea-c113-4e8d-ba59-86c57c26d9fd`;
    } else {
      EndPoint = `${EndPoint}?key=389574ea-c113-4e8d-ba59-86c57c26d9fd`;
    }
    const Parameters = req.body;
    console.log(EndPoint, Parameters);
    const results = await ZEPCRM.callApi(
      EndPoint,
      "POST",
      Parameters,
      contentType
    );
    res.status(200).json(results);
  });

  router.post("/crm/api/:endpoint", async function (req, res) {
    let EndPoint = `${req.params.endpoint}`;
    if (req.query.avatar) {
      EndPoint += `${EndPoint}?key=389574ea-c113-4e8d-ba59-86c57c26d9fd`;
    }
    const Parameters = req.body;
    //console.log(EndPoint, Parameters);
    const results = await ZEPCRM.callApi(EndPoint, "GET", Parameters);
    res.status(200).json(results);
  });
  router.post("/bookings/init", function (req, res) {
    var config = settings.dbConfig.msgraphgtm;

    //tenantId: 'YOUR_TENANT_ID',
    //redirectUri: 'http://localhost:3000/auth/callback',
    //scopes: ['User.Read', 'Calendars.ReadWrite']

    const msalConfig = {
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        redirectUri: config.redirectUri,
      },
    };
  });
  /*--------------------------------------------------------------*/
  router.post("/s3/snapin/signed/retrieve/:account", function (req, res) {
    var userdata = req.user.data,
      schema = "SmartWeb",
      S3USER = aws.awsuserAuth[req.query.account],
      s3Object = JSON.parse(req.body.s3Object),
      logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        params: {
          userID: userdata.id,
          filename: longname,
          action: "Retrieve File URL",
          SubscriberID: userdata.subscriberid,
        },
      };
    retrieveSignedUrl(req, req, s3Object, S3USER, logFileObject);
  });
  router.post("/s3/snapin/save/file/:account", function (req, res) {
    var userdata = req.user.data,
      s3Object = JSON.parse(req.body.s3Object),
      schema = s3Object.schema,
      userAuth = `${s3Object.auth}userAuth`,
      S3USER = aws[userAuth][req.params.account],
      logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        parameters: [
          { name: "userID", value: userdata.id, type: "uniqueidentifier" },
          {
            name: "username",
            value: userdata.local.username,
            type: "nvarchar",
          },
          { name: "file", value: s3Object.fullUrl, type: "nvarchar" },
          { name: "action", value: "Save File", type: "nvarchar" },
          {
            name: "SubscriberID",
            value: userdata.subscriberid,
            type: "uniqueidentifier",
          },
        ],
        fullUrl: s3Object.fullUrl,
      };
    //console.log(logFileObject);
    putS3File(req, res, s3Object, S3USER, logFileObject);
  });
  router.post("/s3/snapin/retrieve/:account", function (req, res) {
    var userdata = req.user.data,
      s3Object = JSON.parse(req.body.s3Object),
      schema = s3Object.schema,
      S3USER = aws.awsuserAuth[req.query.account],
      logFileObject = {
        procedure: schema + ".dbo.all_logFileAccess",
        params: {
          userID: userdata.id,
          filename: longname,
          action: "Retrieve File",
          SubscriberID: userdata.subscriberid,
        },
      };
    retrieveS3File(req, req, s3Object, S3USER, logFileObject);
  });
  /*-----------------------------------------------------
   **  OLD METHODS
   ------------------------------------------------------*/
  router.get("/sys/icons", function (req, res) {
    //var fsImpl = new S3FS('test-bucket', options);
    var userdata = req.user.data,
      subid = "/subscribers/SW0/img/png/icons/";

    s3fsImpl = new S3FS(bucket, {
      accessKeyId: aws.awsuserAuth.s3secure.accessKeyId,
      secretAccessKey: aws.awsuserAuth.s3secure.secretAccessKey,
      region: "us-east-1",
      ACL: "public-read",
    });

    s3fsImpl.listContents(subid, subid).then(
      function (data) {
        res.send(data);
        res.end();
      },
      function (reason) {
        console.log(reason);
        // Something went wrong
      }
    );
  });
  router.get("/files", function (req, res) {
    //var fsImpl = new S3FS('test-bucket', options);
    var userdata = req.user.data,
      subid = "/subscribers/" + userdata.subscriberid + "/";

    if (req.query.path) {
      subid += req.query.path;
    }
    // console.log(subid);
    s3fsImpl.listContents(subid, subid).then(
      function (data) {
        res.send(data);
        res.end();
      },
      function (reason) {
        console.log(reason);
        // Something went wrong
      }
    );
  });
  router.get("/files/:app/:subid", function (req, res) {
    //var fsImpl = new S3FS('test-bucket', options);
    var userdata = req.user.data;
    var subid = req.params.subid;
    if (subid.indexOf("project") > -1) {
      subid = "/gtm/dbqpro/projects"; //"/" + req.params.app + "/" + req.params.subid.replace(":", "/") + "/";
    } else if (subid.indexOf("mappings") > -1) {
      subid = "/gtm/dbqpro/mappings"; //"/" + req.params.app + "/" + req.params.subid.replace(":", "/") + "/";
    } else if (subid.indexOf("pdfs") > -1) {
      subid = "/gtm/dbqpro/pdfs"; //"/" + req.params.app + "/" + req.params.subid.replace(":", "/") + "/";
    } else if (subid.indexOf("clients") > -1) {
      subid = "/gtm/dbqpro/clients"; //"/" + req.params.app + "/" + req.params.subid.replace(":", "/") + "/";
    }

    if (req.query.path) {
      subid += req.query.path;
    }

    readFolder(res, "smartweb-pro.com", subid);
    // console.log(subid);
    /*
    s3fsImpl.listContents(subid, subid).then(
      function (data) {
        res.send(data);
        res.end();
      },
      function (reason) {
        console.log(reason);
        // Something went wrong
      }
    );
  */
  });
  router.get("/private", function (req, res) {
    var userdata = req.user.data,
      subid = "/subscribers/" + userdata.subscriberid + "/";
  });
  router.post("/file/upload/:dest/:type", function (req, res) {
    // console.log("SIGNED URL");

    var userdata = req.user.data,
      subid =
        "subscribers/" + userdata.subscriberid + "/" + req.query.type + "/",
      params = JSON.parse(req.body.sp_params),
      signedURL = {},
      bucket = params.url
        .substring(0, params.url.indexOf(".s3."))
        .replace("https://", ""),
      key = params.url.substring(params.url.indexOf("aws.com") + 8),
      signed = {
        Bucket: bucket,
        Expires: 300,
        Fields: {
          key: "test",
        },
        conditions: [
          { acl: "private" },
          { success_action_status: "201" },
          ["starts-with", "$key", ""],
          ["content-length-range", 0, 1000000],
          { "x-amz-algorithm": "AWS4-HMAC-SHA256" },
        ],
      },
      id = params.id;
    //console.log(params);
    // console.log(bucket);
    signed.Fields.key = key || "filename";
    //console.log(key);
    signedURL = postSignedURL(signed, id);
    if (signedURL.id === 0) {
      res.status(500).json(signedURL);
    } else {
      res.status(200).json(signedURL);
    }
    /*
        S3.createPresignedPost(signed, function (err, url) {
            console.log("Secure POSTOBJECT: signedURL");
            if ( err ) {
                console.log( err );
                res.status(500).json({
                    id: 0, 
                    error: "Error creating presigned URL",
                    url: "https://s3.amazonaws.com/smartweb-pro.com/cdn/images/jpg/unauth.jpg"            
                });
            } 
            console.log(url);
            res.status(200).json({id: id, url:data});
        });
        */
  });
  router.post("/send/email", function (req, res) {
    var userdata = req.user.data,
      fm = req.query.from,
      cc = req.query.ccaddresses ? req.query.ccaddresses : "", // Array
      to = req.query.toaddresses, // Array
      html = req.query.html ? req.query.html : "",
      text = req.query.text ? req.query.text : "No Content",
      reply = req.query.reply ? req.query.reply : "",
      subject = req.query.reply ? req.query.subject : "no subject";
    console.log(" Sending Mail ");
    // Create sendEmail params
    var params = {
      Destination: {
        /* required */ CcAddresses: cc,
        ToAddresses: to,
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
          Text: {
            Charset: "UTF-8",
            Data: text,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: fm /* required */,
      ReplyToAddresses: reply,
      ReturnPath: from ? from : config.aws.ses.from.default,
      Source: from ? from : config.aws.ses.from.default,
    };
    // console.log(params);

    // Create the promise and SES service object
    var sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
      .sendEmail(params)
      .promise();

    // Handle promise's fulfilled/rejected states
    sendPromise
      .then(function (data) {
        console.log(data.MessageId);
      })
      .catch(function (err) {
        console.error(err, err.stack);
        res.send("Email is sent");
      });
  });
  router.post("/saveCanvas", function (req, res) {
    var userdata = req.user.data,
      subid = "/subscribers/" + userdata.subscriberid + "/";

    s3fsImpl.create(subid);

    var cfile = "",
      filename = "",
      simage = null,
      defaultpath = S3root;
    if (req.body.filetable) {
      subid += req.body.filetable + "/";
    }
    cfile = req.body.filename;
    filename = createFileName(cfile, subid);
    longname = defaultpath + filename;
    simage = req.body.img;
    var data = simage.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, "base64");
    s3fsImpl.writeFile(filename, buf, { ACL: "public-read" }).then(function () {
      // console.log('Image Write Complete ' + filename);
      if (err) {
        console.log(err);
      }
    });
    res.end();
  });
  router.post("/blobload/:db/:group", function (req, res) {
    var userdata = req.user.data,
      subid =
        "/subscribers/" +
        userdata.subscriberid +
        "/" +
        req.params.db +
        "/" +
        req.params.group +
        "/";

    s3fsImpl.create(subid);

    var simage = null,
      defaultpath = S3root,
      cfile = req.body.filename;
    (filename = pathFileName(cfile, subid)),
      (longname = defaultpath + filename);
    simage = req.body.img;
    var data = simage.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, "base64");
    // console.log(filename);
    s3fsImpl.writeFile(filename, buf, { ACL: "public-read" }).then(
      function () {
        //console.log('Image Write Complete ' + longname);
        res.send(longname);
        res.end();
      },
      function (reason) {
        console.log(reason);
      }
    );
    // res.end();
  });
  router.post("/upload/:db/:group", function (req, res) {
    var userdata = req.user.data,
      subid =
        "/subscribers/" +
        userdata.subscriberid +
        "/" +
        req.params.db +
        "/" +
        req.params.group;

    s3fsImpl.create(subid);

    var file = null,
      afiles = [],
      stream = [],
      i = 0,
      flen = 0,
      filename = "",
      filepath = [],
      sqlprocess = "",
      bodytype = "",
      types = req.params.group,
      simage = null,
      defaultpath = S3root;
    //  console.log(JSON.stringify( { files: req.files }));
    if (req.files && req.files.FILE && req.files.FILE.path) {
      afiles.push(req.files.FILE);
    } else {
      for (i = 0; i < req.files.FILE.length; i++) {
        afiles.push(req.files.FILE[i]);
      }
    }
    flen = afiles.length;
    afiles["longname"] = [];
    //   console.log(types);
    for (i = 0; i < flen; i++) {
      file = afiles[i];
      stream[i] = fs.createReadStream(file.path);
      bodytype = req.body.filetable;
      if (types.indexOf(bodytype) > -1) {
        filename = createFileName(file.originalFilename, subid);
      } else {
        filename = createFileNameNoExt(file.originalFilename, subid);
      }
      //    console.log(filename);
      afiles.longname.push(defaultpath + filename);
      simage = stream[i];
      s3fsImpl
        .writeFile(filename, simage, { ACL: "public-read" })
        .then(function () {
          fs.unlink(file.path, function (err) {
            if (err) {
              console.log(err);
            }
          });
        });
    }
  });
  router.post("/uploadfiles", function (req, res) {
    var userdata = req.user.data,
      subid =
        "/subscribers/" + userdata.subscriberid + "/" + req.query.path + "/";

    s3fsImpl.create(subid);

    var file = null,
      afiles = [],
      stream = [],
      ctype = "image/jpeg",
      i = 0,
      parts = null,
      flen = 0,
      filename = "",
      filepath = [],
      filext = "",
      sqlprocess = "",
      defaultpath = S3root;

    if (req.files.FILE.path) {
      afiles.push(req.files.FILE);
    } else {
      for (i = 0; i < req.files.FILE.length; i++) {
        afiles.push(req.files.FILE[i]);
      }
    }
    if (req.body.filetable) {
      subid += req.body.filetable + "/";
    }

    flen = afiles.length;
    afiles["longname"] = [];
    for (i = 0; i < flen; i++) {
      file = afiles[i];
      stream[i] = fs.createReadStream(file.path);
      filename = createFileNameNoExt(file.originalFilename, subid);
      afiles.longname.push(defaultpath + filename);
      parts = file.originalFilename.split(".");
      fileext = parts[parts.length - 1].toLowerCase();
      switch (fileext) {
        case "pdf":
          ctype = "application/pdf";
          break;
        case "xls":
          ctype = "application/vnd.ms-excel";
          break;
        case "txt":
          ctype = "text/plain";
          break;
        case "jpg":
          ctype = "image/jpeg";
          break;
        case "svg":
        case "jpeg":
        case "bmp":
        case "gif":
        case "png":
          ctype = "image/" + fileext;
          break;
        case "json":
          ctype = "application/json";
          break;
        case "js":
          ctype = "application/javascript";
          break;
      }
      s3fsImpl
        .writeFile(filename, stream[i], {
          ContentType: ctype,
          ACL: "public-read",
        })
        .then(function () {
          fs.unlink(file.path, function (err) {
            if (err) {
              console.log(err);
            }
          });
          if (req.body.database) {
            sp.runPdfLoad(req, res, afiles.longname[0]);
            afiles.longname.shift();
          }
        });
    }
    res.end();
  });
  router.post("/uploadS3/:client/:app", function (req, res) {
    /*
            required parameter  - path to write file
            optional values     - sub directory of path
        */
    var userdata = req.user.data,
      subid = "/subscribers/" + userdata.subscriberid + "/";

    s3fsImpl.create(subid);

    var file = null,
      afiles = [],
      stream = [],
      ctype = "image/jpeg",
      i = 0,
      parts = null,
      flen = 0,
      filename = "",
      filepath = [],
      appname = "",
      clientid = "",
      filext = "",
      sqlprocess = "",
      defaultpath = S3root;

    if (req.files.FILE.path) {
      afiles.push(req.files.FILE);
    } else {
      for (i = 0; i < req.files.FILE.length; i++) {
        afiles.push(req.files.FILE[i]);
      }
    }
    clientid = req.params.client ? "_" + req.params.client : "_home";
    appname = req.params.app ? "_" + req.params.app : "_system";

    subid += "/_" + clientid + "/_" + appname + "/_" + req.query.path + "/";

    if (req.body.filetable) {
      subid += req.body.filetable + "/";
    }

    flen = afiles.length;
    afiles["longname"] = [];
    for (i = 0; i < flen; i++) {
      file = afiles[i];
      stream[i] = fs.createReadStream(file.path);
      filename = createFileNameNoExt(file.originalFilename, subid);
      afiles.longname.push(defaultpath + filename);
      parts = file.originalFilename.split(".");
      fileext = parts[parts.length - 1].toLowerCase();
      switch (fileext) {
        case "pdf":
          ctype = "application/pdf";
          break;
        case "xls":
          ctype = "application/vnd.ms-excel";
          break;
        case "txt":
          ctype = "text/plain";
          break;
        case "jpg":
          ctype = "image/jpeg";
          break;
        case "svg":
        case "jpeg":
        case "bmp":
        case "gif":
        case "png":
          ctype = "image/" + fileext;
          break;
        case "json":
          ctype = "application/json";
          break;
        case "js":
          ctype = "application/javascript";
          break;
      }
      s3fsImpl
        .writeFile(filename, stream[i], {
          ContentType: ctype,
          ACL: "public-read",
        })
        .then(function () {
          fs.unlink(file.path, function (err) {
            if (err) {
              console.log(err);
            }
          });
          if (req.body.database) {
            sp.runPdfLoad(req, res, afiles.longname[0]);
            afiles.longname.shift();
          }
        });
    }
    res.end();
  });
  router.post("/upload/xls", function (req, res) {
    var userdata = req.user.data,
      subid = "/subscribers/" + userdata.subscriberid + "/_spreadsheet/";

    s3fsImpl.create(subid);

    var file = null,
      afiles = [],
      stream = [],
      i = 0,
      flen = 0,
      filename = "",
      filepath = [],
      sqlprocess = "",
      defaultpath = S3root;
    if (req.files.FILE.path) {
      afiles.push(req.files.FILE);
    } else {
      for (i = 0; i < req.files.FILE.length; i++) {
        // console.log(req.files.FILE[i].originalFilename);
        afiles.push(req.files.FILE[i]);
      }
    }
    flen = afiles.length;
    afiles["longname"] = [];
    for (i = 0; i < flen; i++) {
      file = afiles[i];
      stream[i] = fs.createReadStream(file.path);
      filename = createFileNameNoExt(file.originalFilename, subid);
      afiles.longname.push(defaultpath + filename);

      s3fsImpl
        .writeFile(filename, stream[i], {
          ContentType: "application/vnd.ms-excel",
          ACL: "public-read",
        })
        .then(function () {
          fs.unlink(file.path, function (err) {
            if (err) {
              console.log(err);
            }
          });
          if (req.body.database) {
            sp.runPdfLoad(req, res, afiles.longname[0]);
            afiles.longname.shift();
          }
        });
    }
    res.end();
  });
  router.post("/upload/pdf", function (req, res) {
    var userdata = req.user.data,
      subid = "/subscribers/" + userdata.subscriberid + "/pdf/";

    s3fsImpl.create(subid);

    var file = null,
      afiles = [],
      stream = [],
      i = 0,
      flen = 0,
      filename = "",
      filepath = [],
      sqlprocess = "",
      defaultpath = S3root;
    console.log("FILES: " + req.files);
    if (req.files.FILE.path) {
      afiles.push(req.files.FILE);
    } else {
      for (i = 0; i < req.files.FILE.length; i++) {
        console.log(req.files.FILE[i].originalFilename);
        afiles.push(req.files.FILE[i]);
      }
    }
    flen = afiles.length;
    afiles["longname"] = [];
    for (i = 0; i < flen; i++) {
      file = afiles[i];
      // console.log("STREAM: " + file.path);
      stream[i] = fs.createReadStream(file.path);
      filename = createFileNameNoExt(file.originalFilename, subid);
      afiles.longname.push(defaultpath + filename);
      // console.log("WRITE FILE: " + afiles.longname[i]);
      //  console.log(stream[i]);

      s3fsImpl
        .writeFile(filename, stream[i], {
          ContentType: "application/pdf",
          ACL: "public-read",
        })
        .then(function () {
          fs.unlink(file.path, function (err) {
            if (err) {
              console.log(err);
            }
          });
          if (req.body.database) {
            //  console.log('runPDFLoad: ' + afiles.longname[0]);
            sp.runPdfLoad(req, res, afiles.longname[0]);
            afiles.longname.shift();
          }
        });
    }
    res.end();
  });
  router.post("/write/:app/:subid", function (req, res) {
    var userdata = req.user.data,
      subid = "/" + req.params.app + "/" + req.params.subid + "/",
      contents = req.body.contents,
      filename = req.body.filename,
      bucketPath = req.body.bucket,
      defaultpath = S3root,
      longname = defaultpath + subid + filename;

    AWS.config.update({
      accessKeyId: aws.awsuserAuth.developer.accessKeyId,
      secretAccessKey: aws.awsuserAuth.developer.secretAccessKey,
    });
    AWS.config.region = "us-east-1";
    S3 = new AWS.S3({ apiVersion: "2006-03-01" });
    var params = {
      Key: subid + filename,
      Bucket: bucketPath,
      ContentType: "text/plain",
      Body: contents,
      ACL: "public-read",
    };
    //  console.log(params.Key);
    //   console.log(params.Bucket);
    S3.upload(params, function (err, data) {
      if (err) {
        console.log("Error", err);
      }
      if (data) {
        //         console.log("Upload Success", data.Location);
        res.send({ status: "Success", msg: "Widget updated: " + longname });
      }
      res.end();
    });
  });
  router.post("/s3/save/:app/:subid/:filename", function (req, res) {
    /* https://sandbox.smartweb-pro.com/sys/s3/json/projects/dbqpro_welcome.proj
      https://sandbox.smartweb-pro.com/sys/s3/save/dbq/projects/dbqpro_welcome.proj
      Replace '{bucket}' and '{key}' with the appropriate values for your S3 bucket and PDF file
  */
    const s3 = new AWS.S3();
    const fixFile = req.params.filename.replace(".json", ".proj");

    const parameters = {
      Bucket: "snapin-backup-repo",
      Key: `gtm/dbqpro/projects/${fixFile}`,
      ContentType: "application/json",
      Body: req.body.contents,
      ACL: "public-read",
    };
    // console.log(parameters);
    // Download the PDF file from S3
    S3.upload(parameters, (err, data) => {
      if (err) {
        res.status(err.statusCode).send("Error uploading file to S3");
      } else {
        // Set the headers to allow PDF file download
        if (data) {
          res.send({
            status: "Success",
            msg: "Project updated: " + params.Key,
          });
        }
      }
    });
  });
  router.post("/write/:type", function (req, res) {
    var userdata = req.user.data,
      subid =
        "subscribers/" +
        userdata.subscriberid +
        "/_cdn/" +
        (req.body.mode ? req.body.mode.toLowerCase() : "test") +
        "/" +
        req.params.type +
        "s/",
      contents = req.body.contents,
      filename = req.body.filename,
      bucketPath = req.body.bucket,
      defaultpath = S3root,
      longname = defaultpath + subid + filename;

    AWS.config.update({
      accessKeyId: aws.awsuserAuth.developer.accessKeyId,
      secretAccessKey: aws.awsuserAuth.developer.secretAccessKey,
    });
    AWS.config.region = "us-east-1";
    S3 = new AWS.S3({ apiVersion: "2006-03-01" });
    var params = {
      Key: subid + filename,
      Bucket: bucketPath,
      ContentType: "text/plain",
      Body: contents,
      ACL: "public-read",
    };
    //  console.log(params.Key);
    //   console.log(params.Bucket);
    S3.upload(params, function (err, data) {
      if (err) {
        console.log("Error", err);
      }
      if (data) {
        //         console.log("Upload Success", data.Location);
        res.send({ status: "Success", msg: "Widget updated: " + longname });
      }
      res.end();
    });
  });
  router.post("/publish/catalog/:type", function (req, res) {
    var userdata = req.user.data,
      mode = req.params.type,
      subid = "cdn/smart/widgets/",
      filename = req.body.filename,
      bucketPath = req.body.bucket,
      defaultpath = S3root,
      source = null,
      longname = defaultpath + subid + filename;

    if (mode === "local") {
      source =
        "subscribers/" +
        userdata.subscriberid +
        "/_cdn/test/widgets/" +
        filename;
      subid = "subscribers/" + userdata.subscriberid + "/_cdn/local/widgets/";
    } else if (mode === "global") {
      source =
        "subscribers/" +
        userdata.subscriberid +
        "/_cdn/local/widgets/" +
        filename;
    }
    if (source) {
      AWS.config.update({
        accessKeyId: aws.awsuserAuth.developer.accessKeyId,
        secretAccessKey: aws.awsuserAuth.developer.secretAccessKey,
      });
      AWS.config.region = "us-east-1";
      S3 = new AWS.S3({ apiVersion: "2006-03-01" });
      var params = {
        Key: subid + filename,
        Bucket: bucketPath,
        Source: source,
      };
      S3.copyObject(params, function (err, data) {
        if (err) {
          console.log("Error", err);
          res.send({
            status: "Failed",
            msg: "Widget Failed To Published (" + mode + ") " + longname,
          });
        }
        if (data) {
          //     console.log("Publish Successful", data.Location);
          res.send({
            status: "Success",
            msg: "Widget Published (" + mode + ") " + longname,
          });
        }
        res.end();
      });
    } else {
      res.send({ status: "Failed", msg: "Invalid Publishing Mode" });
    }
  });
  router.post("/upload/text", function (req, res) {
    var userdata = req.user.data,
      subid = "subscribers/" + userdata.subscriberid + "/_text/";

    s3fsImpl.create(subid);

    var file = null,
      afiles = [],
      stream = [],
      i = 0,
      flen = 0,
      filename = "",
      filepath = [],
      sqlprocess = "",
      defaultpath = S3root;
    if (req.files.FILE.path) {
      afiles.push(req.files.FILE);
    } else {
      for (i = 0; i < req.files.FILE.length; i++) {
        afiles.push(req.files.FILE[i]);
      }
    }
    flen = afiles.length;
    afiles["longname"] = [];
    for (i = 0; i < flen; i++) {
      file = afiles[i];
      stream[i] = fs.createReadStream(file.path);
      filename = createFileNameNoExt(file.originalFilename, subid);
      afiles.longname.push(defaultpath + filename);

      s3fsImpl
        .writeFile(filename, stream[i], {
          ContentType: "text/plain",
          ACL: "public-read",
        })
        .then(function () {
          fs.unlink(file.path, function (err) {
            if (err) {
              console.log(err);
            }
          });
          if (req.body.database) {
            sp.runPdfLoad(req, res, afiles.longname[0]);
            afiles.longname.shift();
          }
        });
    }
    res.end();
  });
  router.post("/capture", function (req, res) {
    var userdata = req.user.data,
      subid = "/subscribers/" + userdata.subscriberid + "/";

    s3fsImpl.create(subid);

    var file = null,
      afiles = [],
      stream = null,
      i = 0,
      flen = 0;

    //  console.log("BODY:capture")
    //  console.log(req.body);

    afiles = req.files.FILE;

    if (afiles.path) {
      file = afiles;

      stream = fs.createReadStream(file.path);

      s3fsImpl
        .writeFile(createFileName(file.originalFilename, subid), stream, {
          ACL: "public-read",
        })
        .then(function () {
          fs.unlink(file.path, function (err) {
            if (err) {
              console.error(err);
            }
          });
        });
    } else {
      flen = afiles.length;

      for (i = 0; i < flen; i++) {
        file = afiles[i];

        stream = fs.createReadStream(file.path);

        s3fsImpl
          .writeFile(createFileName(file.originalFilename, subid), stream, {
            ACL: "public-read",
          })
          .then(function () {
            fs.unlink(file.path, function (err) {
              if (err) {
                console.error(err);
              }
            });
          });
      }
    }
    res.end();
  });
  router.get("/directory", function (req, res) {
    var userdata = req.user.data,
      subid = req.query.path;

    s3fsImpl.readdirp(subid).then(
      function (files) {
        res.json(files);

        res.end();
      },
      function (err) {
        console.log(err);

        res.end();
      }
    );
  });
  router.get("/directorytree", function (req, res) {
    var userdata = req.user.data,
      subid = req.query.path;

    s3fsImpl.readdir(subid).then(
      function (files) {
        res.json(files);

        res.end();
      },
      function (err) {
        console.log(err);

        res.end();
      }
    );
  });
  router.get("/directory/:id", function (req, res) {
    var userdata = req.user.data,
      subid =
        "subscribers/" +
        userdata.subscriberid +
        "/" +
        req.params.id +
        req.query.path;

    s3fsImpl.readdirp(subid).then(
      function (files) {
        res.json(files);

        res.end();
      },
      function (err) {
        console.log(err);

        res.end();
      }
    );
  });
  router.get("/directorytree/:id", function (req, res) {
    var userdata = req.user.data,
      subid =
        "subscribers/" +
        userdata.subscriberid +
        "/" +
        req.params.id +
        "/" +
        req.query.path;

    s3fsImpl.readdir(subid).then(
      function (files) {
        res.json(files);

        res.end();
      },
      function (err) {
        console.log(err);

        res.end();
      }
    );
  });

  router.get("/contents", function (req, res) {
    var userdata = req.user.data,
      subid = "subscribers/" + userdata.subscriberid + "/";

    subid += req.query.path;

    s3fsImpl.listContents(subid).then(
      function (files) {
        res.json(files);

        res.end();
      },
      function (err) {
        console.log(err);

        res.end();
      }
    );
  });
  router.get("/contents/:id", function (req, res) {
    var userdata = req.user.data,
      subid =
        "subscribers/" +
        userdata.subscriberid +
        "/" +
        req.params.id +
        req.query.path;

    s3fsImpl.listContents(subid).then(
      function (files) {
        res.json(files);

        res.end();
      },
      function (err) {
        console.log(err);

        res.end();
      }
    );
  });
};
