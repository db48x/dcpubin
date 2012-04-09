var md5 = require("MD5");

var Prog = require("../models/prog").Prog;

function getClientIp(req) {
  
  var ipAddress;
  // Amazon EC2 / Heroku workaround to get real client IP
  var forwardedIpsStr = req.header('x-forwarded-for'); 
  if (forwardedIpsStr) {
    
    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // Ensure getting client IP address still works in
    // development environment
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};

/*
 * GET home page.
 */

exports.index = function(req, res) {
  var shortid;
  var show_copy;
  if (req.params.id) {
    shortid = req.params.id;
    show_copy = true;
  } else {
    shortid = "esRCW6cRn";
    show_copy = false;
  }
  if (shortid) {
    Prog.findOne({shortid: shortid}, function(err, doc) {
		   if (err) {
		     res.end('program not found');
		   }
		   if (doc) {
		     doc.views +=1;
		     doc.save(function(e,d){});
		     res.render('home.ejs', {layout: false,  prog: doc, show_copy: show_copy});  
		   } else {
		     var prog = {prog: "", hex: "", shortid: null};
		     res.render('home.ejs', {layout: false,  prog: prog, show_copy: false});  
		   }
		   
		 });
  } else {
    res.end('error');
  }
  
};

exports.create_new = function(req, res) {
  var prog = new Prog();
  prog.prog = req.body.prog;
  prog.hex = req.body.hex;
  prog.ip = getClientIp(req);
  var hash = md5(prog.prog + prog.hex);
  prog.hash = hash;
  console.log("hash: " + hash);
  console.log("ip: " + prog.ip);

  Prog.findOne({hash: hash}, function(err, doc) {
		 if (err) {
		   res.end('error, error');
		   return;
		 }
		 if (doc) {
		   res.redirect("/" + doc.shortid);
		   return;
		 }

		 prog.save(function (err, new_prog) {
			     if (err) {
			       console.log(err);
			       res.end('there was an error'); // TODO fix
			     }
			     if (new_prog) {
			       var shortid = new_prog.shortid;
			       res.redirect("/" + shortid);
			     } else {
			       res.end('there was an error...'); // TODO fix
			     }
			   });
		 
	       });

};

exports.new_none = function(req, res) {
  res.end('disallowed');
};
