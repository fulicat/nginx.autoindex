/*
* @Author: Jack.Chan
* @Date:   2020-04-26 12:43:31
* @Last Modified by:   Jack.Chan
* @Last Modified time: 2020-04-27 16:58:28
*/

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const replace = require('gulp-replace');

const data = [
	{"name":"dir", "type":"directory", "mtime":"Fri, 24 Apr 2020 05:52:26 GMT"},
	{"name":"head.html", "type":"file", "mtime":"Fri, 24 Apr 2020 04:37:32 GMT", "size":8},
	{"name":"test.json", "type":"file", "mtime":"Fri, 17 Apr 2020 09:08:57 GMT", "size":772},
	{"name":"data.json", "type":"file", "mtime":"Fri, 17 Apr 2020 09:08:42 GMT", "size":2299},
	{"name":"中文.txt", "type":"file", "mtime":"Fri, 24 Apr 2020 05:04:03 GMT", "size":8}
];

function taskMinify() {
	return new Promise((resolve, reject) => {
		console.log('\n', '压缩模板文件 ...', '\n');

		const stream = gulp.src(['./src/*.html'])
		.pipe(htmlmin({collapseWhitespace: true, minifyCSS: true, minifyJS: true}))
		.pipe(gulp.dest('./public/'));
		stream.on('end', function() {
			resolve()
		});
		stream.on('error', function(){
			reject('压缩模板文件 出错');
		});
	});
}

function taskReplace() {
	return new Promise((resolve, reject) => {
		console.log('\n', '读取模板文件 ...', '\n');
		fs.readFile('./public/autoindex.html', 'utf8', function(err, html) {
			if (err) {
				reject('读取模板文件 出错');
			} else {
				var separator = '[{}]';
				if (html.indexOf(separator) > 1) {
					var page_styles = '';
					html = html.replace(/(<style.*?<\/style>)/g, function(match) {
						page_styles = match;
						return '$page_styles';
					});
					if (page_styles) {
						html = html.replace(/\'/g, '\\\'');
						html = html.split(separator);
						var page_start = html[0] +'([';
						var page_end = '])'+ html[1];

						console.log('\n', '生成 nginx.autoindex.conf 配置文件 ...', '\n');

						var stream = gulp.src('./public/autoindex.html')
						.pipe(replace(/\[\{\}\]/g, JSON.stringify(data)))
						.pipe(replace(/\$charset/gi, 'utf-8'))
						.pipe(gulp.dest('./public/'));

						var stream = gulp.src('./src/nginx.autoindex.conf')
						.pipe(replace('%date%', (new Date()).toLocaleString(undefined, {hour12: false})))
						.pipe(replace('%page_styles%', page_styles))
						.pipe(replace('%page_start%', page_start))
						.pipe(replace('%page_end%', page_end))
						.pipe(gulp.dest('./dist/'));
						stream.on('end', function() {
							resolve()
						});
						stream.on('error', function(){
							reject('出错');
						});
					} else {
						reject('HTML模板style 异常');
					}
				} else {
					reject('HTML模板内容 异常');
				}
			}
		});
	});
}

gulp.task('default', function(done) {
	taskMinify().then(taskReplace).then(() => {
		console.log('\n', '成功', '\n\n\n');
	}).catch(err => {
		console.log('\n', 'Err:', err, '\n\n\n\n\n');
	}).finally(() => {
		done();
	});
});