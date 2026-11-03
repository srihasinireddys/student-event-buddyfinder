public class Encapsulation{
     public static void main(String[] args) {
 Box box1 = new Box(2, 3);
 int area1 = box1.area();
 Box box2 = new Box(1, 5);
 int area2 = box2.area();
 System.out.println(area1);
 System.out.println(area2);
 }
}