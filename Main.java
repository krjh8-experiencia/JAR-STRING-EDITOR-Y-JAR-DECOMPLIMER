import static spark.Spark.*;
import com.google.gson.Gson;
import java.io.*;
import java.util.*;

public class Main {

    static Map<String, byte[]> jarFiles = new HashMap<>();

    public static void main(String[] args) {
        port(8080);

        post("/upload", (req, res) -> {
            File jar = File.createTempFile("up", ".jar");
            req.raw().getPart("file").getInputStream()
                .transferTo(new FileOutputStream(jar));

            jarFiles = JarService.readJar(jar);
            return jarFiles.keySet();
        }, new Gson()::toJson);

        get("/file", (req, res) -> {
            String name = req.queryParams("name");
            byte[] data = jarFiles.get(name);

            if (name.endsWith(".class"))
                return JarService.classStrings(data);

            return new String(data);
        });

        post("/save", (req, res) -> {
            jarFiles.put(req.queryParams("name"),
                req.body().getBytes());
            return "OK";
        });

        get("/download", (req, res) -> {
            File jar = JarService.writeJar(jarFiles);
            res.type("application/java-archive");
            res.header("Content-Disposition", "attachment; filename=edited.jar");
            return new FileInputStream(jar);
        });
    }
}
