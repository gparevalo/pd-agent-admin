

docker build -t pd-agent-admin .

# 1. Borramos el contenedor actual
docker rm -f test-admin

# 2. Construimos la imagen desde cero ignorando versiones viejas
docker build --no-cache -t pd-agent-admin .

# 3. Corremos de nuevo
docker run -p 3000:3000 --name test-admin --env-file .env pd-agent-admin

