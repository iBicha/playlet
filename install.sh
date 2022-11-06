# Installs the roku-youtube.zip app as a dev channel

if [ -z "$ROKU_DEV_TARGET" ];
then
    echo "Variable ROKU_DEV_TARGET is not set. What is your Roku TV IP address? Example: 192.168.1.2";
    exit -1
fi

if [ -z "$DEVPASSWORD" ];
then
    echo "Variable DEVPASSWORD is not set. What is your Roku Dev password? Example: 1234";
    exit -1
fi


tmp_folder=$(mktemp -d)
tmp_zip_file="$tmp_folder/roku-youtube.zip"
tmp_http_response_file="$tmp_folder/roku-response.html"

echo "Downloading archive to temprary folder ..."

# TODO: Check for curl, use wget if curl is not available
curl -L https://github.com/iBicha/roku-youtube/releases/latest/download/roku-youtube.zip -o $tmp_zip_file

echo "Installing app on device at $ROKU_DEV_TARGET ..."

curl --user rokudev:$DEVPASSWORD --digest --silent --show-error -F "mysubmit=Install" -F "archive=@$tmp_zip_file" --output $tmp_http_response_file --write-out "%{http_code}" http://$ROKU_DEV_TARGET/plugin_install

echo "Deleting temprary folder ..."

rm -rf $tmp_folder