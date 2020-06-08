FROM nginx:alpine

# Add configuration to enable serving precompressed files with the “.gz” filename extension
COPY ./docker/nginx/gzip.conf /etc/nginx/conf.d/gzip.conf

# Copy source to nginx default serving directory
COPY ./src /usr/share/nginx/html

# Use gzip command to compress html, js and css files
RUN gzip -k -9 $(find /usr/share/nginx/html -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \))
